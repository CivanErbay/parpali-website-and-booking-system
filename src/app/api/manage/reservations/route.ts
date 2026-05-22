import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'
import { assignTableForBooking, occupiedTableIds, toBlockMinutes } from '@/lib/availability'
import { mapPolicy, mapTables, mapReservations } from '@/lib/bookingContext'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

/**
 * POST /api/manage/reservations — staff-created phone / walk-in booking.
 * Bypasses the public maxPartyOnline cap but respects table capacity and the
 * 2.5h hold. `tableIds` honoured if given (manual), otherwise best-fit (auto).
 */
export async function POST(req: Request): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const b = (body ?? {}) as Record<string, unknown>

    if (typeof b.date !== 'string' || !DATE_RE.test(b.date)) {
      return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 })
    }
    if (typeof b.time !== 'string' || !TIME_RE.test(b.time)) {
      return NextResponse.json({ error: 'Ungültige Uhrzeit.' }, { status: 400 })
    }
    const partySize = Number(b.partySize)
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 60) {
      return NextResponse.json({ error: 'Ungültige Personenzahl.' }, { status: 400 })
    }
    if (typeof b.name !== 'string' || b.name.trim().length < 2) {
      return NextResponse.json({ error: 'Name erforderlich.' }, { status: 400 })
    }
    const source = b.source === 'walkin' ? 'walkin' : 'phone'
    const explicitTableIds =
      Array.isArray(b.tableIds) && b.tableIds.every((t) => typeof t === 'string')
        ? (b.tableIds as string[])
        : null

    const [settings, tablesResp, existingResp] = await Promise.all([
      payload.findGlobal({ slug: 'booking-settings' }),
      payload.find({ collection: 'tables', where: { active: { equals: true } }, limit: 200, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'reservations', where: { date: { equals: b.date } }, limit: 500, depth: 0, overrideAccess: true }),
    ])
    const policy = mapPolicy(settings)
    const tables = mapTables(tablesResp.docs)
    const existing = mapReservations(existingResp.docs)

    let assignedTables: string[] = []
    let assignmentMode: 'auto' | 'manual' = 'auto'

    if (explicitTableIds && explicitTableIds.length > 0) {
      const targets = tables.filter((t) => explicitTableIds.includes(t.id))
      if (targets.length !== explicitTableIds.length) {
        return NextResponse.json({ error: 'Unbekannter Tisch.' }, { status: 400 })
      }
      const occupied = occupiedTableIds({
        date: b.date,
        blockStartMin: toBlockMinutes(b.time),
        policy,
        existing,
      })
      if (explicitTableIds.some((t) => occupied.has(t))) {
        return NextResponse.json({ error: 'Tisch in diesem Zeitfenster belegt.' }, { status: 409 })
      }
      assignedTables = explicitTableIds
      assignmentMode = 'manual'
    } else {
      const assignment = assignTableForBooking({
        date: b.date,
        time: b.time,
        partySize,
        policy,
        tables,
        existing,
      })
      if (!assignment.ok) {
        return NextResponse.json(
          { error: 'Kein freier Tisch für dieses Zeitfenster — bitte Tisch manuell wählen.' },
          { status: 409 },
        )
      }
      assignedTables = assignment.option.tableIds
      assignmentMode = 'auto'
    }

    const created = await payload.create({
      collection: 'reservations',
      overrideAccess: true,
      depth: 0,
      data: {
        date: b.date,
        time: b.time,
        partySize,
        name: String(b.name).trim(),
        email: typeof b.email === 'string' && b.email.trim() ? b.email.trim() : 'walkin@parpali.local',
        phone: typeof b.phone === 'string' && b.phone.trim() ? b.phone.trim() : '—',
        notes: typeof b.notes === 'string' ? b.notes.trim() : undefined,
        assignedTables,
        assignmentMode,
        status: 'confirmed',
        source,
      },
    })

    return NextResponse.json({ id: created.id, assignedTables, status: 'confirmed' }, { status: 201 })
  })
}
