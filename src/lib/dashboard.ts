/**
 * Pure helpers for the manage dashboard — date math and the day-grid layout.
 * No I/O, no Payload imports, so it's unit-testable like availability.ts.
 * Dates are naive YYYY-MM-DD strings (same convention as availability.ts).
 */
import type { OpeningRule, HolidayOverride } from './availability'

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

/** YYYY-MM-DD for a Date, using its local calendar day. */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isoToday(): string {
  return isoDate(new Date())
}

export function isValidIso(iso: string): boolean {
  if (!ISO_RE.test(iso)) return false
  const d = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

/** Add (or subtract) whole days to a YYYY-MM-DD string. */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Monday of the week containing `iso` (ISO week — Monday start). */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const dow = d.getUTCDay() // 0 Sun .. 6 Sat
  const delta = dow === 0 ? -6 : 1 - dow
  return addDays(iso, delta)
}

/** The seven YYYY-MM-DD days of the week starting at `start`. */
export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

const WEEKDAY_LABELS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONTH_LABELS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

/** Human German label, e.g. "Montag, 15. Juni 2026". */
export function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${WEEKDAY_LABELS[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Short German label, e.g. "Mo 15.06.". */
export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const wd = WEEKDAY_LABELS[d.getUTCDay()].slice(0, 2)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const mon = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${wd} ${day}.${mon}.`
}

// --- Day-grid layout ------------------------------------------------------

const HHMM_RE = /^\d{2}:\d{2}$/

/** Minutes from midnight for an HH:mm string; null if malformed. */
export function hhmmToMin(hhmm: string): number | null {
  if (!HHMM_RE.test(hhmm)) return null
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** HH:mm for a minutes-from-midnight value. */
export function minToHhmm(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Reservation data the dashboard works with (post-mapping). */
export interface ManageReservation {
  id: string
  name: string
  time: string
  partySize: number
  status: string
  tableIds: string[]
  email?: string
  phone?: string
  notes?: string
  source?: string
}

export interface DayGridTable {
  id: string
  label: string
  capacity: number
  zone: string
  sortOrder: number
}

export interface DayGridReservation extends ManageReservation {
  startMin: number
  endMin: number
}

export interface DayGridRow {
  tableId: string
  label: string
  capacity: number
  zone: string
  reservations: DayGridReservation[]
}

export interface DayGrid {
  date: string
  open: boolean
  startMin: number
  endMin: number
  hourTicks: number[]
  rows: DayGridRow[]
  unassigned: DayGridReservation[]
  totalReservations: number
  totalGuests: number
}

const COUNTS = (status: string): boolean => status !== 'cancelled'

/** German status labels — single source for grid, list and panel. */
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Offen',
  confirmed: 'Bestätigt',
  seated: 'Eingetroffen',
  completed: 'Abgeschlossen',
  'no-show': 'No-Show',
  cancelled: 'Storniert',
}

/** Statuses the owner can move a reservation through, in lifecycle order. */
export const STATUS_FLOW = ['pending', 'confirmed', 'seated', 'completed', 'no-show', 'cancelled'] as const

/** Source labels for phone / walk-in / web bookings. */
export const SOURCE_LABELS: Record<string, string> = {
  web: 'Online',
  phone: 'Telefon',
  walkin: 'Walk-in',
}

/** Resolve the opening segments effective for `date` (holiday overrides win). */
export function resolveSegments(
  date: string,
  openingRules: OpeningRule[],
  holidayOverrides: HolidayOverride[],
): { open: boolean; segments: { open: string; close: string }[] } {
  const holiday = holidayOverrides.find((h) => h.date === date)
  if (holiday?.isClosed) return { open: false, segments: [] }
  if (holiday && holiday.openOverride && holiday.closeOverride) {
    return { open: true, segments: [{ open: holiday.openOverride, close: holiday.closeOverride }] }
  }
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  const rule = openingRules.find((r) => r.weekday === weekday)
  if (!rule || rule.isClosed || rule.segments.length === 0) return { open: false, segments: [] }
  return { open: true, segments: rule.segments }
}

/**
 * Build the day timeline grid: rows = tables, each reservation a block over its
 * hold window. Reservations holding a combined set appear in every member row.
 * Cancelled reservations are excluded from the grid (still in the list view).
 */
export function buildDayGrid(args: {
  date: string
  tables: DayGridTable[]
  reservations: ManageReservation[]
  openingRules: OpeningRule[]
  holidayOverrides: HolidayOverride[]
  tableHoldMinutes: number
}): DayGrid {
  const { date, tables, reservations, openingRules, holidayOverrides, tableHoldMinutes } = args

  const { open, segments } = resolveSegments(date, openingRules, holidayOverrides)

  // Time bounds — from opening segments, padded to whole hours; fallback window
  // when the day is closed so walk-ins can still be placed.
  let lo = open ? Math.min(...segments.map((s) => hhmmToMin(s.open) ?? 11 * 60)) : 11 * 60
  let hi = open
    ? Math.max(...segments.map((s) => (hhmmToMin(s.close) ?? 23 * 60) + tableHoldMinutes))
    : 23 * 60
  lo = Math.floor(lo / 60) * 60
  hi = Math.ceil(hi / 60) * 60
  if (hi <= lo) hi = lo + 60

  const hourTicks: number[] = []
  for (let t = lo; t <= hi; t += 60) hourTicks.push(t)

  const visible = reservations.filter((r) => COUNTS(r.status))
  const layout = (r: ManageReservation): DayGridReservation => {
    const startMin = hhmmToMin(r.time) ?? lo
    return { ...r, startMin, endMin: startMin + tableHoldMinutes }
  }

  const sortedTables = [...tables].sort((a, b) => a.sortOrder - b.sortOrder)
  const rows: DayGridRow[] = sortedTables.map((t) => ({
    tableId: t.id,
    label: t.label,
    capacity: t.capacity,
    zone: t.zone,
    reservations: visible
      .filter((r) => r.tableIds.includes(t.id))
      .map(layout)
      .sort((a, b) => a.startMin - b.startMin),
  }))

  const tableIdSet = new Set(sortedTables.map((t) => t.id))
  const unassigned = visible
    .filter((r) => r.tableIds.filter((id) => tableIdSet.has(id)).length === 0)
    .map(layout)
    .sort((a, b) => a.startMin - b.startMin)

  return {
    date,
    open,
    startMin: lo,
    endMin: hi,
    hourTicks,
    rows,
    unassigned,
    totalReservations: visible.length,
    totalGuests: visible.reduce((s, r) => s + r.partySize, 0),
  }
}
