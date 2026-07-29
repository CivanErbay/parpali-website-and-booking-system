/**
 * Pure mappers from Payload documents to the data shapes `availability.ts`
 * consumes. Kept separate from the pure algorithm (no Payload *types* leak into
 * availability.ts) and from the routes (no duplicated mapping). Each function is
 * a plain transformation — unit-testable, no I/O. Inputs are typed `unknown`
 * because Payload's generated doc types lack an index signature.
 */
import type {
  BookingPolicy,
  OpeningRule,
  HolidayOverride,
  BlackoutDate,
  TableInfo,
  ExistingReservation,
} from './availability'
import type { ManageReservation, DayGridTable } from './dashboard'

type Rec = Record<string, unknown>

const rec = (v: unknown): Rec => (v && typeof v === 'object' ? (v as Rec) : {})

/** A Payload relationship value is either an id or a populated doc. */
const relId = (v: unknown): string => {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (v && typeof v === 'object' && 'id' in v) return String((v as { id: unknown }).id)
  return ''
}
const relIds = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(relId).filter(Boolean) : []

export function mapPolicy(settings: unknown): BookingPolicy {
  const s = rec(settings)
  return {
    slotMinutes: Number(s.slotMinutes ?? 15),
    maxSeatsPerSlot: Number(s.maxSeatsPerSlot ?? 200),
    tableHoldMinutes: Number(s.tableHoldMinutes ?? 120),
    maxStayMinutes: Number(s.maxStayMinutes ?? 300),
    maxPartyOnline: Number(s.maxPartyOnline ?? 8),
    minLeadTimeHours: Number(s.minLeadTimeHours ?? 2),
    advanceWindowDays: Number(s.advanceWindowDays ?? 60),
    maxCombineTables: Number(s.maxCombineTables ?? 3),
  }
}

export function mapOpeningRules(hours: unknown): OpeningRule[] {
  const regular = (rec(hours).regular as
    | { weekday?: string; isClosed?: boolean | null; segments?: { open?: string; close?: string; lastSeating?: string | null }[] | null }[]
    | undefined) ?? []
  return regular.map((r) => ({
    weekday: Number(r.weekday ?? 0),
    isClosed: Boolean(r.isClosed),
    segments: (r.segments ?? [])
      .filter((s): s is { open: string; close: string; lastSeating?: string | null } => Boolean(s?.open) && Boolean(s?.close))
      .map((s) => ({ open: s.open, close: s.close, lastSeating: s.lastSeating || undefined })),
  }))
}

export function mapHolidays(hours: unknown): HolidayOverride[] {
  const holidays = (rec(hours).holidays as
    | { date?: string; isClosed?: boolean | null; openOverride?: string | null; closeOverride?: string | null; lastSeatingOverride?: string | null }[]
    | undefined) ?? []
  return holidays
    .filter((h): h is { date: string } => Boolean(h.date))
    .map((h) => ({
      date: String(h.date).slice(0, 10),
      isClosed: Boolean((h as { isClosed?: boolean }).isClosed),
      openOverride: (h as { openOverride?: string }).openOverride ?? undefined,
      closeOverride: (h as { closeOverride?: string }).closeOverride ?? undefined,
      lastSeatingOverride: (h as { lastSeatingOverride?: string }).lastSeatingOverride ?? undefined,
    }))
}

export function mapBlackouts(settings: unknown): BlackoutDate[] {
  const blackouts = (rec(settings).blackoutDates as { date?: string }[] | undefined) ?? []
  return blackouts
    .filter((b): b is { date: string } => Boolean(b.date))
    .map((b) => ({ date: String(b.date).slice(0, 10) }))
}

export function mapTables(docs: unknown[]): TableInfo[] {
  return docs.map((d) => {
    const t = rec(d)
    return {
      id: relId(t.id),
      label: String(t.label ?? ''),
      capacity: Number(t.capacity ?? 0),
      combinable: Boolean(t.combinable),
      combinesWith: relIds(t.combinesWith),
      active: Boolean(t.active),
      sortOrder: Number(t.sortOrder ?? 0),
    }
  })
}

export function mapReservations(docs: unknown[]): ExistingReservation[] {
  return docs.map((d) => {
    const r = rec(d)
    return {
      date: String(r.date ?? '').slice(0, 10),
      time: String(r.time ?? ''),
      partySize: Number(r.partySize ?? 0),
      status: String(r.status ?? 'pending'),
      tableIds: relIds(r.assignedTables),
      durationMinutes: r.durationMinutes != null ? Number(r.durationMinutes) : undefined,
    }
  })
}

/** Table shape for the dashboard — includes zone, which the algorithm ignores. */
export function mapDashboardTables(docs: unknown[]): DayGridTable[] {
  return docs.map((d) => {
    const t = rec(d)
    return {
      id: relId(t.id),
      label: String(t.label ?? ''),
      capacity: Number(t.capacity ?? 0),
      zone: String(t.zone ?? 'main'),
      sortOrder: Number(t.sortOrder ?? 0),
    }
  })
}

/** Full reservation shape for the dashboard (guest details + table ids). */
export function mapManageReservations(docs: unknown[]): ManageReservation[] {
  return docs.map((d) => {
    const r = rec(d)
    return {
      id: relId(r.id),
      name: String(r.name ?? ''),
      time: String(r.time ?? ''),
      partySize: Number(r.partySize ?? 0),
      status: String(r.status ?? 'pending'),
      tableIds: relIds(r.assignedTables),
      email: r.email ? String(r.email) : undefined,
      phone: r.phone ? String(r.phone) : undefined,
      notes: r.notes ? String(r.notes) : undefined,
      source: r.source ? String(r.source) : undefined,
    }
  })
}
