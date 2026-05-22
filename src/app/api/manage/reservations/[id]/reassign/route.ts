import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'
import { occupiedTableIds, toBlockMinutes } from '@/lib/availability'
import { mapPolicy, mapTables, mapReservations } from '@/lib/bookingContext'

/**
 * POST /api/manage/reservations/:id/reassign — move a reservation to a chosen
 * set of tables. `tableIds: []` unassigns. Target tables must be active and
 * free for the reservation's hold window; sets assignmentMode to 'manual'.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    const { id } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const raw = (body as Record<string, unknown>)?.tableIds
    if (!Array.isArray(raw) || raw.some((t) => typeof t !== 'string')) {
      return NextResponse.json({ error: 'tableIds muss eine Liste sein.' }, { status: 400 })
    }
    const tableIds = raw as string[]

    const reservation = await payload.findByID({ collection: 'reservations', id, depth: 0 }).catch(() => null)
    if (!reservation) {
      return NextResponse.json({ error: 'Reservierung nicht gefunden.' }, { status: 404 })
    }
    const date = String(reservation.date).slice(0, 10)
    const time = String(reservation.time)

    if (tableIds.length > 0) {
      const [settings, tablesResp, existingResp] = await Promise.all([
        payload.findGlobal({ slug: 'booking-settings' }),
        payload.find({ collection: 'tables', limit: 200, depth: 0, overrideAccess: true }),
        payload.find({ collection: 'reservations', where: { date: { equals: date } }, limit: 500, depth: 0, overrideAccess: true }),
      ])
      const policy = mapPolicy(settings)
      const tables = mapTables(tablesResp.docs)
      const targets = tables.filter((t) => tableIds.includes(t.id))
      if (targets.length !== tableIds.length || targets.some((t) => !t.active)) {
        return NextResponse.json({ error: 'Mindestens ein Tisch ist unbekannt oder inaktiv.' }, { status: 400 })
      }
      // Free-check against every other reservation in the block.
      const others = mapReservations(existingResp.docs.filter((d) => String(d.id) !== String(id)))
      const occupied = occupiedTableIds({
        date,
        blockStartMin: toBlockMinutes(time),
        policy,
        existing: others,
      })
      const clash = tableIds.filter((t) => occupied.has(t))
      if (clash.length > 0) {
        return NextResponse.json(
          { error: 'Mindestens ein Tisch ist in diesem Zeitfenster bereits belegt.' },
          { status: 409 },
        )
      }
    }

    const updated = await payload.update({
      collection: 'reservations',
      id,
      overrideAccess: true,
      depth: 0,
      data: { assignedTables: tableIds, assignmentMode: 'manual' },
    })
    return NextResponse.json({ id: updated.id, assignedTables: tableIds, assignmentMode: 'manual' })
  })
}
