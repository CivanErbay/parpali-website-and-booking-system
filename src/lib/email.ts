/**
 * Thin Resend wrapper + transactional e-mail templates for the booking flow.
 * Lazy-imports the SDK so the project still builds without it; in dev without
 * RESEND_API_KEY the send is a logged no-op.
 *
 * EMAIL STYLING NOTE: e-mail clients support neither CSS custom properties nor
 * (reliably) web fonts, so the templates use inline styles with literal hex
 * values that MIRROR the design tokens in src/shared/tokens.css, and serif/sans
 * fallbacks for Fraunces/Manrope. This is a deliberate, documented exception to
 * the "components use var(--token)" contract — e-mail is a separate render
 * context. Keep these hex values in sync with the Editorial-Tuscan palette.
 */

interface SendArgs {
  to: string
  subject: string
  html: string
  replyTo?: string
}

const SENDER = process.env.RESEND_FROM_EMAIL ?? 'Parpali <reservierung@parpali-hennef.de>'

export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email skipped:', { to, subject })
    return
  }
  const { Resend } = await import('resend')
  const client = new Resend(apiKey)
  const result = await client.emails.send({ from: SENDER, to, subject, html, replyTo })
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

// --- Editorial-Tuscan palette (mirrors src/shared/tokens.css) -------------
const C = {
  bg: '#f5f0e4', // page
  card: '#fffcf5', // warm white card (accent-fg)
  fg: '#1f2e1f', // cypress
  fg2: '#4a5a4a',
  fg3: '#6e7a6c',
  accent: '#c28b2c', // saffron
  accentFg: '#fffcf5',
  border: '#d6ccb4',
  danger: '#a4161a',
}
const SERIF = "Georgia, 'Times New Roman', serif" // Fraunces fallback
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" // Manrope fallback

interface Row {
  label: string
  /** Pre-escaped / trusted HTML (callers escape user data themselves). */
  value: string
}

/** Shared, e-mail-client-safe shell: centered card, wordmark, saffron rule, footer. */
function emailLayout(opts: {
  eyebrow: string
  heading: string
  introHtml: string
  rows?: Row[]
  cta?: { url: string; label: string }
  footerHtml?: string
}): string {
  const { eyebrow, heading, introHtml, rows, cta, footerHtml } = opts
  const rowsHtml = (rows ?? [])
    .map(
      (r) => `
        <tr>
          <td style="padding:6px 20px 6px 0;color:${C.fg3};font-size:14px;vertical-align:top;white-space:nowrap;">${escapeHtml(r.label)}</td>
          <td style="padding:6px 0;color:${C.fg};font-size:15px;font-weight:700;">${r.value}</td>
        </tr>`,
    )
    .join('')

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;"><tr><td style="border-radius:999px;background:${C.accent};">
         <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:14px;font-weight:700;letter-spacing:0.04em;color:${C.accentFg};text-decoration:none;border-radius:999px;">${escapeHtml(cta.label)}</a>
       </td></tr></table>`
    : ''

  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:8px 8px 20px;text-align:center;">
          <div style="font-family:${SERIF};font-size:13px;letter-spacing:0.28em;text-transform:uppercase;color:${C.fg3};">${escapeHtml(eyebrow)}</div>
          <div style="font-family:${SERIF};font-style:italic;font-size:30px;color:${C.fg};margin-top:4px;">Parpali</div>
        </td></tr>
        <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:36px 32px;">
          <div style="width:40px;height:3px;background:${C.accent};border-radius:2px;margin:0 0 20px;"></div>
          <h1 style="font-family:${SERIF};font-size:26px;line-height:1.2;color:${C.fg};margin:0 0 16px;">${escapeHtml(heading)}</h1>
          <div style="font-family:${SANS};font-size:15px;line-height:1.65;color:${C.fg2};">${introHtml}</div>
          ${rows && rows.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0;font-family:${SANS};">${rowsHtml}</table>` : ''}
          ${ctaHtml}
        </td></tr>
        ${
          footerHtml
            ? `<tr><td style="padding:22px 32px 8px;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.fg3};">${footerHtml}</td></tr>`
            : ''
        }
      </table>
    </td></tr>
  </table>
</body></html>`
}

const footerContact = (name: string, phone: string, email: string): string =>
  `<strong style="color:${C.fg2};">${escapeHtml(name)}</strong>` +
  (phone ? ` · <a href="tel:${escapeHtml(phone)}" style="color:${C.accent};text-decoration:none;">${escapeHtml(phone)}</a>` : '') +
  (email ? ` · <a href="mailto:${escapeHtml(email)}" style="color:${C.accent};text-decoration:none;">${escapeHtml(email)}</a>` : '')

const SOURCE_LABELS: Record<string, string> = { web: 'Online', phone: 'Telefon', walkin: 'Walk-in' }

// --- Templates ------------------------------------------------------------

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
  const rows: Row[] = [
    { label: 'Datum', value: escapeHtml(date) },
    { label: 'Uhrzeit', value: escapeHtml(time) },
    { label: 'Personen', value: String(partySize) },
  ]
  if (notes) rows.push({ label: 'Notiz', value: escapeHtml(notes) })
  return emailLayout({
    eyebrow: 'Reservierung',
    heading: 'Reservierung bestätigt',
    introHtml: `<p style="margin:0 0 14px;">Liebe/r ${escapeHtml(name)},</p>
      <p style="margin:0;">vielen Dank für deine Reservierung im <strong style="color:${C.fg};">${escapeHtml(restaurantName)}</strong>. Wir freuen uns auf deinen Besuch.</p>`,
    rows,
    cta: cancel ? { url: cancel, label: 'Reservierung stornieren' } : undefined,
    footerHtml:
      `Falls du dich verspätest oder nicht kommen kannst, sag uns bitte kurz Bescheid:<br>` +
      footerContact(restaurantName, restaurantPhone, restaurantEmail),
  })
}

export function reservationOwnerNotificationHtml(args: {
  guestName: string
  guestEmail: string
  guestPhone: string
  date: string
  time: string
  partySize: number
  notes?: string
  source?: string
  restaurantName: string
}): string {
  const { guestName, guestEmail, guestPhone, date, time, partySize, notes, source, restaurantName } = args
  const rows: Row[] = [
    { label: 'Gast', value: escapeHtml(guestName) },
    { label: 'Personen', value: String(partySize) },
    { label: 'Datum', value: escapeHtml(date) },
    { label: 'Uhrzeit', value: escapeHtml(time) },
  ]
  if (guestPhone && guestPhone !== '—')
    rows.push({ label: 'Telefon', value: `<a href="tel:${escapeHtml(guestPhone)}" style="color:${C.accent};text-decoration:none;">${escapeHtml(guestPhone)}</a>` })
  if (guestEmail)
    rows.push({ label: 'E-Mail', value: `<a href="mailto:${escapeHtml(guestEmail)}" style="color:${C.accent};text-decoration:none;">${escapeHtml(guestEmail)}</a>` })
  rows.push({ label: 'Quelle', value: escapeHtml(SOURCE_LABELS[source ?? 'web'] ?? source ?? 'Online') })
  if (notes) rows.push({ label: 'Notiz', value: escapeHtml(notes) })

  return emailLayout({
    eyebrow: 'Dashboard',
    heading: 'Neue Reservierung',
    introHtml: `<p style="margin:0;">Es ist eine neue Reservierung für <strong style="color:${C.fg};">${escapeHtml(restaurantName)}</strong> eingegangen. Antworte direkt auf diese E-Mail, um den Gast zu erreichen.</p>`,
    rows,
  })
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
  return emailLayout({
    eyebrow: 'Erinnerung',
    heading: 'Wir freuen uns auf dich',
    introHtml: `<p style="margin:0 0 14px;">Liebe/r ${escapeHtml(name)},</p>
      <p style="margin:0;">eine kurze Erinnerung an deine Reservierung im <strong style="color:${C.fg};">${escapeHtml(restaurantName)}</strong>:</p>`,
    rows: [
      { label: 'Datum', value: escapeHtml(date) },
      { label: 'Uhrzeit', value: escapeHtml(time) },
      { label: 'Personen', value: String(partySize) },
    ],
    cta: cancel ? { url: cancel, label: 'Reservierung stornieren' } : undefined,
    footerHtml: `Falls sich etwas ändert, ruf uns kurz an: ` + footerContact(restaurantName, restaurantPhone, ''),
  })
}

export function reservationCancelledHtml(args: {
  name: string
  date: string
  time: string
  restaurantName: string
}): string {
  const { name, date, time, restaurantName } = args
  return emailLayout({
    eyebrow: 'Reservierung',
    heading: 'Reservierung storniert',
    introHtml: `<p style="margin:0 0 14px;">Liebe/r ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px;">deine Reservierung im <strong style="color:${C.fg};">${escapeHtml(restaurantName)}</strong> am <strong style="color:${C.fg};">${escapeHtml(date)}</strong> um <strong style="color:${C.fg};">${escapeHtml(time)}</strong> wurde storniert.</p>
      <p style="margin:0;">Wir würden uns freuen, dich ein andermal begrüßen zu dürfen.</p>`,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
