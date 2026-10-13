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
  active: boolean
  sortOrder: number
}

export interface ExistingReservation {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  partySize: number
  status: string // any non-cancelled / non-no-show counts toward occupancy
  tableIds: string[] // tables this reservation holds; [] if unassigned (legacy)
  durationMinutes?: number // hold length for this reservation; falls back to policy.tableHoldMinutes
}

export interface BookingPolicy {
  slotMinutes: number
  maxSeatsPerSlot: number // soft per-slot throughput ceiling (kitchen pacing)
  tableHoldMinutes: number // minimum & default stay duration
  maxStayMinutes: number // cap for guest-selected longer stays
  maxPartyOnline: number
  minLeadTimeHours: number
  advanceWindowDays: number
  /** The only table groups that may be pushed together — each with its own party range. */
  tableCombos: TableCombo[]
}

/**
 * An owner-defined table combination. Its seat count is NOT the sum of the member
 * tables (e.g. T1+T2 seat 4, T1+T3 seat 6, but T1+T2+T3 seat 12), so it carries
 * its own `maxParty` and an optional `minParty` floor.
 */
export interface TableCombo {
  tableIds: string[]
  minParty?: number
  maxParty: number
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
 * Enumerate every table set that can seat `partySize`:
 *  - each active single table with capacity >= partySize, and
 *  - each owner-defined combination whose member tables are all free and whose
 *    party range (`minParty`..`maxParty`) contains `partySize`.
 * No other groupings are ever formed — only the configured combinations.
 */
export function enumerateTableOptions(args: {
  tables: TableInfo[]
  partySize: number
  combos: TableCombo[]
}): TableOption[] {
  const { tables, partySize, combos } = args
  if (partySize < 1) return []

  const byId = new Map(tables.filter((t) => t.active).map((t) => [t.id, t]))
  const options: TableOption[] = []

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

  for (const c of combos) {
    if (c.tableIds.length < 2) continue
    if (partySize > c.maxParty || partySize < (c.minParty ?? 1)) continue
    const members = c.tableIds.map((id) => byId.get(id))
    if (members.some((m) => !m)) continue
    options.push({
      tableIds: [...c.tableIds].sort(),
      totalCapacity: c.maxParty,
      waste: c.maxParty - partySize,
      sortKey: members.reduce((s, t) => s + t!.sortOrder, 0),
    })
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
 * Table ids occupied by any non-cancelled reservation whose hold window
 * overlaps the candidate block starting at `blockStartMin` (minutes from
 * midnight) on `date`. Each existing reservation uses its own
 * `durationMinutes` (falling back to `policy.tableHoldMinutes` for legacy
 * docs); the candidate block uses `candidateDurationMinutes` (defaults to
 * `policy.tableHoldMinutes`, i.e. the same fixed-length check as before this
 * reservation could pick its own stay length).
 */
export function occupiedTableIds(args: {
  date: string
  blockStartMin: number
  policy: BookingPolicy
  existing: ExistingReservation[]
  candidateDurationMinutes?: number
}): Set<string> {
  const { date, blockStartMin, policy, existing } = args
  const candidateHold = args.candidateDurationMinutes ?? policy.tableHoldMinutes
  const occupied = new Set<string>()
  for (const r of existing) {
    if (r.date !== date || !ACTIVE_STATUSES(r.status)) continue
    const rt = toMinutes(r.time)
    const existingHold = r.durationMinutes ?? policy.tableHoldMinutes
    if (rt + existingHold > blockStartMin && rt < blockStartMin + candidateHold) {
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
  candidateDurationMinutes?: number
}): number {
  const { date, blockStartMin, policy, existing } = args
  const candidateHold = args.candidateDurationMinutes ?? policy.tableHoldMinutes
  return existing
    .filter((r) => r.date === date && ACTIVE_STATUSES(r.status))
    .filter((r) => {
      const rt = toMinutes(r.time)
      const existingHold = r.durationMinutes ?? policy.tableHoldMinutes
      return rt + existingHold > blockStartMin && rt < blockStartMin + candidateHold
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
  /** Requested stay length for this booking; defaults to policy.tableHoldMinutes. */
  stayMinutes?: number
  /** Owner "Notknopf" — when true, the entire reservation service is halted. */
  emergencyStop?: boolean
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
  const stayMinutes = args.stayMinutes ?? policy.tableHoldMinutes

  if (args.emergencyStop) return []
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

      // Guests choosing a longer-than-default stay can't book so late that it
      // would run past closing — evening slots naturally offer less (or none)
      // of the extended range. Default-length requests are unaffected (this
      // only tightens the window; `lastStart` above already guarantees the
      // default stay fits).
      if (stayMinutes > policy.tableHoldMinutes && t + stayMinutes > end) continue

      // Soft kitchen-throughput ceiling
      const taken = seatsTakenInBlock({
        date,
        blockStartMin: t,
        policy,
        existing,
        candidateDurationMinutes: stayMinutes,
      })
      if (taken + partySize > policy.maxSeatsPerSlot) continue

      // Per-table availability
      const occupied = occupiedTableIds({
        date,
        blockStartMin: t,
        policy,
        existing,
        candidateDurationMinutes: stayMinutes,
      })
      const freeTables = activeTables.filter((tbl) => !occupied.has(tbl.id))
      const options = enumerateTableOptions({
        tables: freeTables,
        partySize,
        combos: policy.tableCombos,
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
  /** Stay length of the booking being assigned; defaults to policy.tableHoldMinutes. */
  stayMinutes?: number
}):
  | { ok: true; option: TableOption }
  | { ok: false; reason: 'no-fit' | 'over-ceiling' } {
  const { date, time, partySize, policy, tables, existing } = args
  const stayMinutes = args.stayMinutes ?? policy.tableHoldMinutes

  const blockStartMin = toMinutes(time)

  const taken = seatsTakenInBlock({
    date,
    blockStartMin,
    policy,
    existing,
    candidateDurationMinutes: stayMinutes,
  })
  if (taken + partySize > policy.maxSeatsPerSlot) {
    return { ok: false, reason: 'over-ceiling' }
  }

  const occupied = occupiedTableIds({
    date,
    blockStartMin,
    policy,
    existing,
    candidateDurationMinutes: stayMinutes,
  })
  const freeTables = tables.filter((t) => t.active && !occupied.has(t.id))
  const options = enumerateTableOptions({
    tables: freeTables,
    partySize,
    combos: policy.tableCombos,
  })
  const best = pickBestFit(options)
  if (!best) return { ok: false, reason: 'no-fit' }
  return { ok: true, option: best }
}
