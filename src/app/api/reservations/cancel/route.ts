import { getPayload } from 'payload'
import config from '@payload-config'
import { reservationCancelledHtml, sendEmail } from '@/lib/email'

/**
 * Public guest self-cancellation, authorized purely by the `cancelToken` from
 * the confirmation email (ADR-0012). GET renders a confirm page (so an email
 * client prefetch can't cancel a booking); POST performs the cancellation.
 */

const SHELL = (title: string, inner: string): string => `<!doctype html>
<html lang="de"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f0e4;color:#1f2e1f;">
<div style="max-width:480px;margin:48px auto;padding:32px;background:#fffcf5;border:1px solid #d6ccb4;border-radius:8px;">
${inner}
</div></body></html>`

const htmlResponse = (body: string, status = 200): Response =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function findByToken(token: string) {
  const payload = await getPayload({ config })
  const found = await payload.find({
    collection: 'reservations',
    where: { cancelToken: { equals: token } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return { payload, doc: found.docs[0] }
}

export async function GET(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return htmlResponse(SHELL('Ungültiger Link', '<h1>Ungültiger Link</h1><p>Dieser Stornierungslink ist nicht gültig.</p>'), 400)
  }
  const { doc } = await findByToken(token)
  if (!doc) {
    return htmlResponse(SHELL('Nicht gefunden', '<h1>Reservierung nicht gefunden</h1><p>Diese Reservierung existiert nicht mehr.</p>'), 404)
  }
  if (doc.status === 'cancelled') {
    return htmlResponse(SHELL('Bereits storniert', '<h1>Bereits storniert</h1><p>Diese Reservierung wurde bereits storniert.</p>'))
  }
  const when = `${escapeHtml(String(doc.date).slice(0, 10))} um ${escapeHtml(String(doc.time))}`
  return htmlResponse(
    SHELL(
      'Reservierung stornieren',
      `<h1 style="font-size:22px;margin:0 0 16px;">Reservierung stornieren?</h1>
       <p style="color:#4a5a4a;">Reservierung am <strong>${when}</strong> für <strong>${escapeHtml(String(doc.partySize))}</strong> Personen.</p>
       <form method="post" action="/api/reservations/cancel?token=${encodeURIComponent(token)}">
         <button type="submit" style="margin-top:16px;padding:12px 20px;background:#a4161a;color:#fffcf5;border:0;border-radius:999px;font-size:15px;cursor:pointer;">Jetzt stornieren</button>
       </form>`,
    ),
  )
}

export async function POST(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return htmlResponse(SHELL('Ungültiger Link', '<h1>Ungültiger Link</h1>'), 400)
  }
  const { payload, doc } = await findByToken(token)
  if (!doc) {
    return htmlResponse(SHELL('Nicht gefunden', '<h1>Reservierung nicht gefunden</h1>'), 404)
  }
  if (doc.status !== 'cancelled') {
    await payload.update({
      collection: 'reservations',
      id: doc.id,
      overrideAccess: true,
      data: { status: 'cancelled' },
    })
    try {
      const contact = await payload.findGlobal({ slug: 'contact-info' })
      await sendEmail({
        to: String(doc.email),
        subject: `Reservierung storniert — ${String(contact?.restaurantName ?? 'Parpali')}`,
        html: reservationCancelledHtml({
          name: String(doc.name),
          date: String(doc.date).slice(0, 10),
          time: String(doc.time),
          restaurantName: String(contact?.restaurantName ?? 'Parpali'),
        }),
      })
    } catch (err) {
      console.error('[cancel] confirmation email failed (cancellation saved):', err)
    }
  }
  return htmlResponse(
    SHELL(
      'Storniert',
      '<h1 style="font-size:22px;margin:0 0 16px;">Reservierung storniert</h1><p style="color:#4a5a4a;">Deine Reservierung wurde storniert. Schade — vielleicht ein andermal!</p>',
    ),
  )
}
