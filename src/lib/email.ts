/**
 * Thin Resend wrapper. Lazy-imports the SDK so the project still builds when
 * the dependency isn't installed (e.g., a fresh fork before `pnpm install`).
 * In dev without RESEND_API_KEY set, calls log to console and resolve.
 */

interface SendArgs {
  to: string
  subject: string
  html: string
  replyTo?: string
}

const SENDER = process.env.RESEND_FROM_EMAIL ?? 'Parpali <noreply@parpali.de>'

export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email skipped:', { to, subject })
    return
  }
  const { Resend } = await import('resend')
  const client = new Resend(apiKey)
  const result = await client.emails.send({
    from: SENDER,
    to,
    subject,
    html,
    replyTo,
  })
  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`)
  }
}

/** Public booking-cancel URL for a reservation token; '' when no site URL is configured. */
export function cancelUrl(cancelToken: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  if (!base || !cancelToken) return ''
  return `${base.replace(/\/$/, '')}/api/reservations/cancel?token=${encodeURIComponent(cancelToken)}`
}

export function reservationConfirmationHtml(args: {
  name: string
  date: string
  time: string
  partySize: number
  notes?: string
  restaurantName: string
  restaurantPhone: string
  restaurantEmail: string
  cancelToken?: string
}): string {
  const { name, date, time, partySize, notes, restaurantName, restaurantPhone, restaurantEmail, cancelToken } = args
  const cancel = cancelToken ? cancelUrl(cancelToken) : ''
  return `
    <div style="font-family: 'Karla', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2a1810;">
      <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 0 0 8px;">Reservierung bestätigt</h1>
      <p style="margin: 0 0 24px; color: #5c4a3f;">Liebe/r ${escapeHtml(name)},</p>
      <p style="margin: 0 0 24px;">vielen Dank für deine Reservierung im <strong>${escapeHtml(restaurantName)}</strong>. Wir freuen uns auf deinen Besuch.</p>
      <table style="border-collapse: collapse; margin: 0 0 24px;">
        <tr><td style="padding: 4px 16px 4px 0; color: #8a7867;">Datum</td><td style="padding: 4px 0;"><strong>${escapeHtml(date)}</strong></td></tr>
        <tr><td style="padding: 4px 16px 4px 0; color: #8a7867;">Uhrzeit</td><td style="padding: 4px 0;"><strong>${escapeHtml(time)}</strong></td></tr>
        <tr><td style="padding: 4px 16px 4px 0; color: #8a7867;">Personen</td><td style="padding: 4px 0;"><strong>${partySize}</strong></td></tr>
        ${notes ? `<tr><td style="padding: 4px 16px 4px 0; color: #8a7867; vertical-align: top;">Notiz</td><td style="padding: 4px 0;">${escapeHtml(notes)}</td></tr>` : ''}
      </table>
      <p style="margin: 0 0 8px; color: #5c4a3f;">Falls du dich verspätest oder nicht kommen kannst, sag uns bitte kurz Bescheid:</p>
      <p style="margin: 0;">Telefon: <a href="tel:${escapeHtml(restaurantPhone)}" style="color: #a4161a;">${escapeHtml(restaurantPhone)}</a></p>
      <p style="margin: 0;">E-Mail: <a href="mailto:${escapeHtml(restaurantEmail)}" style="color: #a4161a;">${escapeHtml(restaurantEmail)}</a></p>
      ${cancel ? `<p style="margin: 24px 0 0;"><a href="${escapeHtml(cancel)}" style="color: #8a7867; font-size: 14px;">Reservierung stornieren</a></p>` : ''}
    </div>
  `
}

export function reservationReminderHtml(args: {
  name: string
  date: string
  time: string
  partySize: number
  restaurantName: string
  restaurantPhone: string
  cancelToken?: string
}): string {
  const { name, date, time, partySize, restaurantName, restaurantPhone, cancelToken } = args
  const cancel = cancelToken ? cancelUrl(cancelToken) : ''
  return `
    <div style="font-family: 'Karla', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2a1810;">
      <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 0 0 8px;">Wir freuen uns auf dich</h1>
      <p style="margin: 0 0 24px; color: #5c4a3f;">Liebe/r ${escapeHtml(name)},</p>
      <p style="margin: 0 0 24px;">eine kurze Erinnerung an deine Reservierung im <strong>${escapeHtml(restaurantName)}</strong>:</p>
      <table style="border-collapse: collapse; margin: 0 0 24px;">
        <tr><td style="padding: 4px 16px 4px 0; color: #8a7867;">Datum</td><td style="padding: 4px 0;"><strong>${escapeHtml(date)}</strong></td></tr>
        <tr><td style="padding: 4px 16px 4px 0; color: #8a7867;">Uhrzeit</td><td style="padding: 4px 0;"><strong>${escapeHtml(time)}</strong></td></tr>
        <tr><td style="padding: 4px 16px 4px 0; color: #8a7867;">Personen</td><td style="padding: 4px 0;"><strong>${partySize}</strong></td></tr>
      </table>
      <p style="margin: 0; color: #5c4a3f;">Falls sich etwas ändert, ruf uns kurz an: <a href="tel:${escapeHtml(restaurantPhone)}" style="color: #a4161a;">${escapeHtml(restaurantPhone)}</a></p>
      ${cancel ? `<p style="margin: 24px 0 0;"><a href="${escapeHtml(cancel)}" style="color: #8a7867; font-size: 14px;">Reservierung stornieren</a></p>` : ''}
    </div>
  `
}

export function reservationCancelledHtml(args: {
  name: string
  date: string
  time: string
  restaurantName: string
}): string {
  const { name, date, time, restaurantName } = args
  return `
    <div style="font-family: 'Karla', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2a1810;">
      <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 0 0 8px;">Reservierung storniert</h1>
      <p style="margin: 0 0 24px; color: #5c4a3f;">Liebe/r ${escapeHtml(name)},</p>
      <p style="margin: 0 0 24px;">deine Reservierung im <strong>${escapeHtml(restaurantName)}</strong> am
        <strong>${escapeHtml(date)}</strong> um <strong>${escapeHtml(time)}</strong> wurde storniert.</p>
      <p style="margin: 0; color: #5c4a3f;">Wir würden uns freuen, dich ein andermal begrüßen zu dürfen.</p>
    </div>
  `
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
