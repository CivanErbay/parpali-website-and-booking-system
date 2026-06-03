import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { reservationReminderHtml, sendEmail } from '@/lib/email'
import { isoToday } from '@/lib/dashboard'

/**
 * GET /api/cron/reminders — sends a reminder email for every still-active
 * reservation today that has not been reminded yet. Idempotent via
 * `reminderSentAt`, so it is safe to run hourly or once each morning.
 *
 * Trigger it from a system cron on the VPS. If CRON_SECRET is set it must be
 * passed as `?secret=` or a `Bearer` Authorization header.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const url = new URL(req.url)
    const provided =
      url.searchParams.get('secret') ??
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      ''
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const payload = await getPayload({ config })
  const today = isoToday()
  const contact = await payload.findGlobal({ slug: 'contact-info' })
  const restaurantName = String(contact?.restaurantName ?? 'Parpali')
  const restaurantPhone = String(contact?.phone ?? '')
  const restaurantAddress = [
    String(contact?.street ?? ''),
    [String(contact?.zip ?? ''), String(contact?.city ?? '')].filter((s) => s.trim()).join(' '),
  ]
    .filter((s) => s.trim())
    .join(', ')

  const resp = await payload.find({
    collection: 'reservations',
    where: {
      and: [
        { date: { equals: today } },
        { status: { in: ['pending', 'confirmed'] } },
        { reminderSentAt: { exists: false } },
      ],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  let sent = 0
  for (const r of resp.docs) {
    if (!r.email) continue
    try {
      await sendEmail({
        to: String(r.email),
        subject: `Erinnerung — ${restaurantName} · heute um ${String(r.time)} Uhr`,
        html: reservationReminderHtml({
          name: String(r.name),
          date: today,
          time: String(r.time),
          partySize: Number(r.partySize),
          restaurantName,
          restaurantPhone,
          restaurantAddress,
          cancelToken: r.cancelToken ? String(r.cancelToken) : undefined,
        }),
        // No freemail Reply-To (avoids FREEMAIL_FORGED_REPLYTO spam flag).
      })
      await payload.update({
        collection: 'reservations',
        id: r.id,
        overrideAccess: true,
        data: { reminderSentAt: new Date().toISOString() },
      })
      sent++
    } catch (err) {
      console.error('[cron/reminders] failed for reservation', r.id, err)
    }
  }

  return NextResponse.json({ date: today, candidates: resp.docs.length, sent })
}
