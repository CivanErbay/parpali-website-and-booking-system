/**
 * Pure per-table availability + assignment logic (ADR-0012). No I/O, no Payload
 * imports — only data in, data out — so it's trivially unit-testable and the
 * API routes can plug it in.
 *
 * INVARIANT: `date` (YYYY-MM-DD) and `time` (HH:mm) are naive local wall-clock
 * strings. All minute math is wall-clock; the only Date use is `getUTCDay()` on
 * a `T00:00:00Z` date (safe — the date string already encodes the local day)
 * and the injected `now`. Any consumer comparing against a stored `holdUntil`
 * must build that value the same naive way (see reservationDerivedFields hook).
 */

export interface OpeningSegment {
  open: string // HH:mm
  close: string // HH:mm
  // Latest time a guest may *start* (last seating). When set, it caps the slot
  // grid directly — independent of `close`, so the table can be held past close
  // (a 21:00 booking keeps its table until 21:00 + hold). When absent, the last
  // slot falls back to `close − tableHoldMinutes`.
  lastSeating?: string // HH:mm
}

export interface OpeningRule {
  weekday: number // 0 (Sun) .. 6 (Sat)
  isClosed: boolean
  segments: OpeningSegment[]
}

export interface HolidayOverride {
  date: string // YYYY-MM-DD
  isClosed: boolean
  openOverride?: string
  closeOverride?: string
  lastSeatingOverride?: string // HH:mm — see OpeningSegment.lastSeating
}

export interface BlackoutDate {
  date: string // YYYY-MM-DD
}

export interface TableInfo {
  id: string
  label: string
  capacity: number
  combinable: boolean
  combinesWith: string[] // ids of tables this one may be pushed together with
  active: boolean
  sortOrder: number
}

export interface ExistingReservation {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  partySize: number
  status: string // any non-cancelled / non-no-show counts toward occupancy
  tableIds: string[] // tables this reservation holds; [] if unassigned (legacy)
}

export interface BookingPolicy {
  slotMinutes: number
  maxSeatsPerSlot: number // soft per-slot throughput ceiling (kitchen pacing)
  tableHoldMinutes: number
  maxPartyOnline: number
  minLeadTimeHours: number
  advanceWindowDays: number
  maxCombineTables: number
}

/** One viable way to seat a party: a single table or a combined group. */
export interface TableOption {
  tableIds: string[]
  totalCapacity: number
  waste: number // totalCapacity - partySize, always >= 0
  sortKey: number // summed sortOrder of the member tables (tie-break)
}

export interface OpenSlot {
  time: string // HH:mm
  assignableTables: number // number of viable table options for this slot
  bestOption: TableOption
}

const HHMM_RE = /^\d{2}:\d{2}$/

const toMinutes = (hhmm: string): number => {
  if (!HHMM_RE.test(hhmm)) throw new Error(`Invalid time: ${hhmm}`)
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const fromMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

const ACTIVE_STATUSES = (status: string): boolean =>
  status !== 'cancelled' && status !== 'no-show'

/** Public wrapper: minutes-from-midnight for an HH:mm string (throws on bad input). */
export function toBlockMinutes(hhmm: string): number {
  return toMinutes(hhmm)
}

/**
 * Build an undirected adjacency map from the (possibly one-sided) `combinesWith`
 * declarations. If A lists B, A and B are adjacent even if B doesn't list A.
 * Only `combinable && active` tables are included.
 */
function buildAdjacency(tables: TableInfo[]): Map<string, Set<string>> {
  const eligible = new Map(
    tables.filter((t) => t.combinable && t.active).map((t) => [t.id, t]),
  )
  const adj = new Map<string, Set<string>>()
  for (const id of eligible.keys()) adj.set(id, new Set())
  for (const t of eligible.values()) {
    for (const other of t.combinesWith) {
      if (!eligible.has(other) || other === t.id) continue
      adj.get(t.id)!.add(other)
      adj.get(other)!.add(t.id)
    }
  }
  return adj
}

/**
 * Enumerate every table set that can seat `partySize`:
 *  - each active single table with capacity >= partySize, and
 *  - each connected group of combinable tables (size 2..maxCombineTables,
 *    walking only declared adjacency) whose summed capacity >= partySize.
 * Bounded DFS; `maxCombineTables` is the hard guard against combinatorial blowup.
 */
export function enumerateTableOptions(args: {
  tables: TableInfo[]
  partySize: number
  maxCombineTables: number
}): TableOption[] {
  const { tables, partySize, maxCombineTables } = args
  if (partySize < 1) return []

  const byId = new Map(tables.filter((t) => t.active).map((t) => [t.id, t]))
  const options: TableOption[] = []

  // Single tables
  for (const t of byId.values()) {
    if (t.capacity >= partySize) {
      options.push({
        tableIds: [t.id],
        totalCapacity: t.capacity,
        waste: t.capacity - partySize,
        sortKey: t.sortOrder,
      })
    }
  }

  // Combined groups — connected subsets of the adjacency graph
  const cap = Math.max(2, Math.min(maxCombineTables, byId.size))
  if (cap >= 2) {
    const adj = buildAdjacency(tables)
    const seen = new Set<string>()

    const grow = (members: string[]): void => {
      const key = [...members].sort().join('|')
      if (seen.has(key)) return
      seen.add(key)

      if (members.length >= 2) {
        const memberTables = members.map((id) => byId.get(id)!).filter(Boolean)
        if (memberTables.length === members.length) {
          const totalCapacity = memberTables.reduce((s, t) => s + t.capacity, 0)
          if (totalCapacity >= partySize) {
            options.push({
              tableIds: [...members].sort(),
              totalCapacity,
              waste: totalCapacity - partySize,
              sortKey: memberTables.reduce((s, t) => s + t.sortOrder, 0),
            })
          }
        }
      }
      if (members.length >= cap) return

      const memberSet = new Set(members)
      const candidates = new Set<string>()
      for (const m of members) {
        for (const n of adj.get(m) ?? []) {
          if (!memberSet.has(n)) candidates.add(n)
        }
      }
      for (const c of candidates) grow([...members, c])
    }

    for (const id of adj.keys()) grow([id])
  }

  return options
}

/**
 * Deterministic best-fit: minimal waste, then fewest tables, then lowest summed
 * sortOrder, then lexicographic tableIds. Returns null if `options` is empty.
 */
export function pickBestFit(options: TableOption[]): TableOption | null {
  if (options.length === 0) return null
  const sorted = [...options].sort((a, b) => {
    if (a.waste !== b.waste) return a.waste - b.waste
    if (a.tableIds.length !== b.tableIds.length)
      return a.tableIds.length - b.tableIds.length
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
    return a.tableIds.join('|').localeCompare(b.tableIds.join('|'))
  })
  return sorted[0]
}

/**
 * Table ids occupied by any non-cancelled reservation whose 2.5h hold window
 * overlaps the candidate block starting at `blockStartMin` (minutes from
 * midnight) on `date`.
 */
export function occupiedTableIds(args: {
  date: string
  blockStartMin: number
  policy: BookingPolicy
  existing: ExistingReservation[]
}): Set<string> {
  const { date, blockStartMin, policy, existing } = args
  const hold = policy.tableHoldMinutes
  const occupied = new Set<string>()
  for (const r of existing) {
    if (r.date !== date || !ACTIVE_STATUSES(r.status)) continue
    const rt = toMinutes(r.time)
    if (rt + hold > blockStartMin && rt < blockStartMin + hold) {
      for (const id of r.tableIds) occupied.add(id)
    }
  }
  return occupied
}

/** Sum of party sizes of reservations overlapping the block — soft ceiling input. */
function seatsTakenInBlock(args: {
  date: string
  blockStartMin: number
  policy: BookingPolicy
  existing: ExistingReservation[]
}): number {
  const { date, blockStartMin, policy, existing } = args
  const hold = policy.tableHoldMinutes
  return existing
    .filter((r) => r.date === date && ACTIVE_STATUSES(r.status))
    .filter((r) => {
      const rt = toMinutes(r.time)
      return rt + hold > blockStartMin && rt < blockStartMin + hold
    })
    .reduce((sum, r) => sum + r.partySize, 0)
}

/**
 * Build the list of open slots for a given date: opening hours, holidays,
 * blackouts and lead time gate the slot grid; per slot, free tables are
 * enumerated and a best-fit option must exist, and the soft `maxSeatsPerSlot`
 * ceiling must not be exceeded.
 *
 * `now` is injected so callers pass a real Date in production, a fixed one in tests.
 */
export function getOpenSlots(args: {
  date: string
  now: Date
  policy: BookingPolicy
  openingRules: OpeningRule[]
  holidayOverrides: HolidayOverride[]
  blackoutDates: BlackoutDate[]
  partySize: number
  tables: TableInfo[]
  existing: ExistingReservation[]
}): OpenSlot[] {
  const {
    date,
    now,
    policy,
    openingRules,
    holidayOverrides,
    blackoutDates,
    partySize,
    tables,
    existing,
  } = args

  if (partySize < 1 || partySize > policy.maxPartyOnline) return []

  const targetDate = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(targetDate.getTime())) return []

  // Advance-window check
  const maxFuture = new Date(now)
  maxFuture.setUTCDate(maxFuture.getUTCDate() + policy.advanceWindowDays)
  if (targetDate > maxFuture) return []

  // Blackout dates
  if (blackoutDates.some((b) => b.date === date)) return []

  // Holiday override
  const holiday = holidayOverrides.find((h) => h.date === date)
  if (holiday?.isClosed) return []

  // Opening rule for the weekday — overridden by holiday if it provides times
  const weekday = targetDate.getUTCDay()
  let segments: OpeningSegment[] = []
  if (holiday && holiday.openOverride && holiday.closeOverride) {
    segments = [
      {
        open: holiday.openOverride,
        close: holiday.closeOverride,
        lastSeating: holiday.lastSeatingOverride,
      },
    ]
  } else {
    const rule = openingRules.find((r) => r.weekday === weekday)
    if (!rule || rule.isClosed) return []
    segments = rule.segments
  }
  if (segments.length === 0) return []

  // Lead-time floor (only relevant when booking for today)
  const leadFloor = new Date(now.getTime() + policy.minLeadTimeHours * 60 * 60 * 1000)
  const isToday = leadFloor.toISOString().slice(0, 10) === date

  const activeTables = tables.filter((t) => t.active)
  const slots: OpenSlot[] = []

  for (const seg of segments) {
    const start = toMinutes(seg.open)
    const end = toMinutes(seg.close)
    if (end <= start) continue
    // An explicit `lastSeating` IS the last bookable start — authoritative and
    // independent of `close` (the table is simply held its hold-window past
    // close, e.g. a 22:00 booking keeps its table until 00:30). Without it, the
    // last slot falls back to `close − tableHoldMinutes`.
    const lastStart = seg.lastSeating
      ? toMinutes(seg.lastSeating)
      : end - policy.tableHoldMinutes
    for (let t = start; t <= lastStart; t += policy.slotMinutes) {
      if (isToday) {
        const leadMinFromMidnight =
          leadFloor.getUTCHours() * 60 + leadFloor.getUTCMinutes()
        if (t < leadMinFromMidnight) continue
      }

      // Soft kitchen-throughput ceiling
      const taken = seatsTakenInBlock({ date, blockStartMin: t, policy, existing })
      if (taken + partySize > policy.maxSeatsPerSlot) continue

      // Per-table availability
      const occupied = occupiedTableIds({ date, blockStartMin: t, policy, existing })
      const freeTables = activeTables.filter((tbl) => !occupied.has(tbl.id))
      const options = enumerateTableOptions({
        tables: freeTables,
        partySize,
        maxCombineTables: policy.maxCombineTables,
      })
      const best = pickBestFit(options)
      if (best) {
        slots.push({ time: fromMinutes(t), assignableTables: options.length, bestOption: best })
      }
    }
  }
  return slots
}

/**
 * Assign tables for a concrete booking. Pure — the caller owns the DB write and
 * the concurrency guard. Re-derives free tables for the exact block so it can be
 * called right before the write to narrow the race window, and reused by the
 * dashboard walk-in path. Opening-hours validation is the caller's job (the
 * public route validates via getOpenSlots first).
 */
export function assignTableForBooking(args: {
  date: string
  time: string
  partySize: number
  policy: BookingPolicy
  tables: TableInfo[]
  existing: ExistingReservation[]
}):
  | { ok: true; option: TableOption }
  | { ok: false; reason: 'no-fit' | 'over-ceiling' } {
  const { date, time, partySize, policy, tables, existing } = args

  const blockStartMin = toMinutes(time)

  const taken = seatsTakenInBlock({ date, blockStartMin, policy, existing })
  if (taken + partySize > policy.maxSeatsPerSlot) {
    return { ok: false, reason: 'over-ceiling' }
  }

  const occupied = occupiedTableIds({ date, blockStartMin, policy, existing })
  const freeTables = tables.filter((t) => t.active && !occupied.has(t.id))
  const options = enumerateTableOptions({
    tables: freeTables,
    partySize,
    maxCombineTables: policy.maxCombineTables,
  })
  const best = pickBestFit(options)
  if (!best) return { ok: false, reason: 'no-fit' }
  return { ok: true, option: best }
}
