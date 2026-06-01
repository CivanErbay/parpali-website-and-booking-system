import { describe, it, expect } from 'vitest'
import {
  enumerateTableOptions,
  pickBestFit,
  occupiedTableIds,
  getOpenSlots,
  assignTableForBooking,
  type TableInfo,
  type BookingPolicy,
  type OpeningRule,
  type ExistingReservation,
} from './availability'

// --- Fixtures -------------------------------------------------------------

/** T1,T2 = 2-tops; T3,T4 = 4-tops; T5 = 6-top. Chain T1-T2-T3-T4 combinable. */
const tables = (): TableInfo[] => [
  { id: 'T1', label: 'T1', capacity: 2, combinable: true, combinesWith: ['T2'], active: true, sortOrder: 1 },
  { id: 'T2', label: 'T2', capacity: 2, combinable: true, combinesWith: ['T1', 'T3'], active: true, sortOrder: 2 },
  { id: 'T3', label: 'T3', capacity: 4, combinable: true, combinesWith: ['T2', 'T4'], active: true, sortOrder: 3 },
  { id: 'T4', label: 'T4', capacity: 4, combinable: true, combinesWith: ['T3'], active: true, sortOrder: 4 },
  { id: 'T5', label: 'T5', capacity: 6, combinable: false, combinesWith: [], active: true, sortOrder: 5 },
]

const policy = (over: Partial<BookingPolicy> = {}): BookingPolicy => ({
  slotMinutes: 30,
  maxSeatsPerSlot: 200,
  tableHoldMinutes: 150,
  maxPartyOnline: 12,
  minLeadTimeHours: 2,
  advanceWindowDays: 60,
  maxCombineTables: 3,
  ...over,
})

// 2026-06-15 is a Monday (weekday 1); open 17:00-23:00.
const MON = '2026-06-15'
const openMonday = (): OpeningRule[] => [
  { weekday: 1, isClosed: false, segments: [{ open: '17:00', close: '23:00' }] },
]
const NOW = new Date('2026-06-10T12:00:00Z') // 5 days before, not "today"

const res = (over: Partial<ExistingReservation> = {}): ExistingReservation => ({
  date: MON,
  time: '18:00',
  partySize: 2,
  status: 'confirmed',
  tableIds: [],
  ...over,
})

// --- enumerateTableOptions ------------------------------------------------

describe('enumerateTableOptions', () => {
  it('returns single tables that fit', () => {
    const opts = enumerateTableOptions({ tables: tables(), partySize: 2, maxCombineTables: 3 })
    const singles = opts.filter((o) => o.tableIds.length === 1).map((o) => o.tableIds[0]).sort()
    expect(singles).toEqual(['T1', 'T2', 'T3', 'T4', 'T5'])
  })

  it('excludes single tables that are too small', () => {
    const opts = enumerateTableOptions({ tables: tables(), partySize: 5, maxCombineTables: 3 })
    const singles = opts.filter((o) => o.tableIds.length === 1).map((o) => o.tableIds[0])
    expect(singles).toEqual(['T5']) // only the 6-top fits a party of 5 alone
  })

  it('combines adjacent combinable tables for a large party', () => {
    const opts = enumerateTableOptions({ tables: tables(), partySize: 8, maxCombineTables: 3 })
    const combos = opts.filter((o) => o.tableIds.length > 1).map((o) => o.tableIds.join('+'))
    expect(combos).toContain('T3+T4') // 4 + 4 = 8
  })

  it('does not combine non-adjacent tables', () => {
    const opts = enumerateTableOptions({ tables: tables(), partySize: 8, maxCombineTables: 3 })
    // T1+T4 are not connected — must never appear as a group
    expect(opts.some((o) => o.tableIds.join('+') === 'T1+T4')).toBe(false)
  })

  it('respects the maxCombineTables cap', () => {
    const chain: TableInfo[] = [
      { id: 'A', label: 'A', capacity: 2, combinable: true, combinesWith: ['B'], active: true, sortOrder: 1 },
      { id: 'B', label: 'B', capacity: 2, combinable: true, combinesWith: ['A', 'C'], active: true, sortOrder: 2 },
      { id: 'C', label: 'C', capacity: 2, combinable: true, combinesWith: ['B'], active: true, sortOrder: 3 },
    ]
    expect(enumerateTableOptions({ tables: chain, partySize: 6, maxCombineTables: 3 }).length).toBeGreaterThan(0)
    expect(enumerateTableOptions({ tables: chain, partySize: 6, maxCombineTables: 2 })).toEqual([])
  })

  it('excludes inactive tables', () => {
    const ts = tables().map((t) => (t.id === 'T5' ? { ...t, active: false } : t))
    const opts = enumerateTableOptions({ tables: ts, partySize: 5, maxCombineTables: 3 })
    expect(opts.some((o) => o.tableIds.includes('T5'))).toBe(false)
  })
})

// --- pickBestFit ----------------------------------------------------------

describe('pickBestFit', () => {
  it('returns null for no options', () => {
    expect(pickBestFit([])).toBeNull()
  })

  it('picks minimal waste — a party of 2 takes a 2-top, not a 4-top', () => {
    const opts = enumerateTableOptions({ tables: tables(), partySize: 2, maxCombineTables: 3 })
    const best = pickBestFit(opts)
    expect(best?.tableIds).toEqual(['T1']) // waste 0, fewest tables, lowest sortOrder
  })

  it('prefers fewer tables on a waste tie', () => {
    const opts = enumerateTableOptions({ tables: tables(), partySize: 8, maxCombineTables: 3 })
    const best = pickBestFit(opts)
    expect(best?.tableIds).toEqual(['T3', 'T4']) // 2 tables beats the 3-table chain
  })

  it('prefers a single big table over combining on a waste tie', () => {
    // party 5: T5 (waste 1, 1 table) vs T2+T3 (waste 1, 2 tables)
    const opts = enumerateTableOptions({ tables: tables(), partySize: 5, maxCombineTables: 3 })
    expect(pickBestFit(opts)?.tableIds).toEqual(['T5'])
  })
})

// --- occupiedTableIds -----------------------------------------------------

describe('occupiedTableIds', () => {
  it('marks tables of an overlapping reservation as occupied', () => {
    const existing = [res({ time: '18:00', tableIds: ['T3'] })]
    // block at 19:00 (1140) overlaps the 18:00+150 hold
    const occ = occupiedTableIds({ date: MON, blockStartMin: 19 * 60, policy: policy(), existing })
    expect([...occ]).toEqual(['T3'])
  })

  it('ignores reservations whose hold window does not overlap', () => {
    const existing = [res({ time: '18:00', tableIds: ['T3'] })]
    // block at 21:00 (1260) — 18:00 hold ends 20:30, no overlap
    const occ = occupiedTableIds({ date: MON, blockStartMin: 21 * 60, policy: policy(), existing })
    expect(occ.size).toBe(0)
  })

  it('ignores cancelled and no-show reservations', () => {
    const existing = [
      res({ time: '18:00', tableIds: ['T3'], status: 'cancelled' }),
      res({ time: '18:00', tableIds: ['T4'], status: 'no-show' }),
    ]
    const occ = occupiedTableIds({ date: MON, blockStartMin: 18 * 60, policy: policy(), existing })
    expect(occ.size).toBe(0)
  })
})

// --- getOpenSlots ---------------------------------------------------------

describe('getOpenSlots', () => {
  const base = {
    date: MON,
    now: NOW,
    policy: policy(),
    openingRules: openMonday(),
    holidayOverrides: [],
    blackoutDates: [],
    tables: tables(),
    existing: [] as ExistingReservation[],
  }

  it('generates 30-min slots from 17:00 to the last 2.5h-fitting slot 20:30', () => {
    const slots = getOpenSlots({ ...base, partySize: 2 })
    expect(slots[0].time).toBe('17:00')
    expect(slots[slots.length - 1].time).toBe('20:30')
  })

  it('returns an empty list on a closed weekday', () => {
    expect(getOpenSlots({ ...base, partySize: 2, openingRules: [] })).toEqual([])
  })

  it('returns an empty list on a blackout date', () => {
    expect(getOpenSlots({ ...base, partySize: 2, blackoutDates: [{ date: MON }] })).toEqual([])
  })

  it('returns an empty list when a holiday closes the day', () => {
    const holidayOverrides = [{ date: MON, isClosed: true }]
    expect(getOpenSlots({ ...base, partySize: 2, holidayOverrides })).toEqual([])
  })

  it('returns an empty list beyond the advance window', () => {
    const slots = getOpenSlots({ ...base, partySize: 2, policy: policy({ advanceWindowDays: 1 }) })
    expect(slots).toEqual([])
  })

  it('assigns best-fit per slot — a party of 2 gets the 2-top T1', () => {
    const slots = getOpenSlots({ ...base, partySize: 2 })
    expect(slots[0].bestOption.tableIds).toEqual(['T1'])
  })

  it('combines tables for a party of 8', () => {
    const slots = getOpenSlots({ ...base, partySize: 8 })
    expect(slots[0].bestOption.tableIds).toEqual(['T3', 'T4'])
  })

  it('blocks following slots once a table is held for 2.5h', () => {
    // every table booked at 18:00 except T5 leaves only T5 free 18:00-20:00
    const existing: ExistingReservation[] = [
      res({ time: '18:00', tableIds: ['T1'] }),
      res({ time: '18:00', tableIds: ['T2'] }),
      res({ time: '18:00', tableIds: ['T3'] }),
      res({ time: '18:00', tableIds: ['T4'] }),
    ]
    const slots = getOpenSlots({ ...base, partySize: 2, existing })
    const at1830 = slots.find((s) => s.time === '18:30')
    expect(at1830?.bestOption.tableIds).toEqual(['T5']) // only the 6-top is free
    const at1800 = slots.find((s) => s.time === '18:00')
    expect(at1800?.bestOption.tableIds).toEqual(['T5'])
  })

  it('drops a slot when every table is held', () => {
    const existing: ExistingReservation[] = tables().map((t) =>
      res({ time: '18:00', tableIds: [t.id] }),
    )
    const slots = getOpenSlots({ ...base, partySize: 2, existing })
    expect(slots.some((s) => s.time === '18:00')).toBe(false)
  })

  it('honours the soft maxSeatsPerSlot ceiling', () => {
    // ceiling 4: one party of 4 already in the block fills it
    const existing = [res({ time: '18:00', partySize: 4, tableIds: ['T3'] })]
    const slots = getOpenSlots({
      ...base,
      partySize: 2,
      policy: policy({ maxSeatsPerSlot: 4 }),
      existing,
    })
    expect(slots.some((s) => s.time === '18:00')).toBe(false)
  })

  it('caps the last slot at an explicit lastSeating, ignoring close − hold', () => {
    // open 17:00–23:00, lastSeating 21:00 → last bookable slot is 21:00,
    // even though close − hold would only allow 20:30. The table is held past
    // close (21:00 + 2.5h = 23:30); that is intentional.
    const openingRules: OpeningRule[] = [
      { weekday: 1, isClosed: false, segments: [{ open: '17:00', close: '23:00', lastSeating: '21:00' }] },
    ]
    const slots = getOpenSlots({ ...base, partySize: 2, openingRules })
    expect(slots[0].time).toBe('17:00')
    expect(slots[slots.length - 1].time).toBe('21:00')
  })

  it('falls back to close − hold when no lastSeating is set', () => {
    const slots = getOpenSlots({ ...base, partySize: 2, openingRules: openMonday() })
    expect(slots[slots.length - 1].time).toBe('20:30')
  })

  it('treats lastSeating as the last start even past close (table held beyond close)', () => {
    const openingRules: OpeningRule[] = [
      { weekday: 1, isClosed: false, segments: [{ open: '17:00', close: '21:00', lastSeating: '22:00' }] },
    ]
    const slots = getOpenSlots({ ...base, partySize: 2, openingRules })
    expect(slots[slots.length - 1].time).toBe('22:00')
  })

  it('applies lastSeatingOverride from a holiday override', () => {
    const holidayOverrides = [
      { date: MON, isClosed: false, openOverride: '17:00', closeOverride: '23:00', lastSeatingOverride: '20:00' },
    ]
    const slots = getOpenSlots({ ...base, partySize: 2, holidayOverrides })
    expect(slots[slots.length - 1].time).toBe('20:00')
  })
})

// --- assignTableForBooking ------------------------------------------------

describe('assignTableForBooking', () => {
  it('assigns the best-fit table', () => {
    const r = assignTableForBooking({
      date: MON,
      time: '18:00',
      partySize: 4,
      policy: policy(),
      tables: tables(),
      existing: [],
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.option.tableIds).toEqual(['T3']) // smallest exact-ish fit
  })

  it('fails with no-fit when all tables are held', () => {
    const existing: ExistingReservation[] = tables().map((t) =>
      res({ time: '18:00', tableIds: [t.id] }),
    )
    const r = assignTableForBooking({
      date: MON,
      time: '18:00',
      partySize: 2,
      policy: policy(),
      tables: tables(),
      existing,
    })
    expect(r).toEqual({ ok: false, reason: 'no-fit' })
  })

  it('fails with over-ceiling when the soft ceiling is exceeded', () => {
    const existing = [res({ time: '18:00', partySize: 4, tableIds: ['T3'] })]
    const r = assignTableForBooking({
      date: MON,
      time: '18:00',
      partySize: 2,
      policy: policy({ maxSeatsPerSlot: 4 }),
      tables: tables(),
      existing,
    })
    expect(r).toEqual({ ok: false, reason: 'over-ceiling' })
  })
})
