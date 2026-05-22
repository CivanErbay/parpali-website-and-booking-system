import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'
import { reservationCancelledHtml, sendEmail } from '@/lib/email'

type ResStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'no-show' | 'cancelled'
const STATUSES: ResStatus[] = ['pending', 'confirmed', 'seated', 'completed', 'no-show', 'cancelled']

/** POST /api/manage/reservations/:id/status — change a reservation's status. */
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
    const status = (body as Record<string, unknown>)?.status
    if (typeof status !== 'string' || !STATUSES.includes(status as ResStatus)) {
      return NextResponse.json({ error: 'Ungültiger Status.' }, { status: 400 })
    }

    try {
      const updated = await payload.update({
        collection: 'reservations',
        id,
        overrideAccess: true,
        data: { status: status as ResStatus },
      })

      if (status === 'cancelled' && updated.email) {
        try {
          const contact = await payload.findGlobal({ slug: 'contact-info' })
          await sendEmail({
            to: String(updated.email),
            subject: `Reservierung storniert — ${String(contact?.restaurantName ?? 'Parpali')}`,
            html: reservationCancelledHtml({
              name: String(updated.name),
              date: String(updated.date).slice(0, 10),
              time: String(updated.time),
              restaurantName: String(contact?.restaurantName ?? 'Parpali'),
            }),
          })
        } catch (err) {
          console.error('[manage/status] cancellation email failed:', err)
        }
      }

      return NextResponse.json({ id: updated.id, status: updated.status })
    } catch {
      return NextResponse.json({ error: 'Reservierung nicht gefunden.' }, { status: 404 })
    }
  })
}
