import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { sendEmail } from '../../../lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SUBJECT_LABEL: Record<string, string> = {
  reservierung: 'Reservierung / Anfrage',
  event: 'Event / Private Dining',
  catering: 'Catering',
  feedback: 'Feedback',
  sonstiges: 'Sonstiges',
}

const SUBJECT_TO_EVENT_TYPE: Record<string, string | undefined> = {
  event: 'private-dining',
  catering: 'catering',
}

interface InquiryPayload {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

function validate(body: unknown): { ok: true; data: InquiryPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid body.' }
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || b.name.trim().length < 2) return { ok: false, error: 'Name erforderlich.' }
  if (typeof b.email !== 'string' || !EMAIL_RE.test(b.email)) return { ok: false, error: 'Gültige E-Mail erforderlich.' }
  if (typeof b.message !== 'string' || b.message.trim().length < 5) return { ok: false, error: 'Nachricht zu kurz.' }
  const subject = typeof b.subject === 'string' && SUBJECT_LABEL[b.subject] ? b.subject : 'sonstiges'
  return {
    ok: true,
    data: {
      name: b.name.trim(),
      email: b.email.trim(),
      phone: typeof b.phone === 'string' ? b.phone.trim() : undefined,
      subject,
      message: b.message.trim(),
    },
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }
  const v = validate(body)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
  const data = v.data

  const payload = await getPayload({ config })

  const created = await payload.create({
    collection: 'inquiries',
    overrideAccess: true,
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: SUBJECT_LABEL[data.subject],
      message: data.message,
      eventType: (SUBJECT_TO_EVENT_TYPE[data.subject] ?? 'general') as
        | 'private-dining'
        | 'weinabend'
        | 'catering'
        | 'firmenfeier'
        | 'general',
      status: 'new',
    },
  })

  try {
    const contact = await payload.findGlobal({ slug: 'contact-info' })
    const restaurantEmail = String((contact as { email?: string })?.email ?? '')
    if (restaurantEmail) {
      await sendEmail({
        to: restaurantEmail,
        subject: `Neue Anfrage — ${SUBJECT_LABEL[data.subject]} · ${data.name}`,
        html: `
<!doctype html>
<html><body style="font-family: ui-sans-serif, system-ui; color: #2a1810; line-height: 1.6; padding: 24px;">
  <h2 style="margin: 0 0 12px; font-family: Georgia, serif;">Neue Anfrage über parpali.de</h2>
  <p style="margin: 0 0 16px; color: #5a4538;">${escapeHtml(SUBJECT_LABEL[data.subject])}</p>
  <table style="border-collapse: collapse; margin-bottom: 16px;">
    <tr><td style="padding: 4px 12px 4px 0; color: #76624f;">Name</td><td><strong>${escapeHtml(data.name)}</strong></td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #76624f;">E-Mail</td><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
    ${data.phone ? `<tr><td style="padding: 4px 12px 4px 0; color: #76624f;">Telefon</td><td>${escapeHtml(data.phone)}</td></tr>` : ''}
  </table>
  <div style="background: #fbf7f1; border-left: 3px solid #a4161a; padding: 12px 16px; white-space: pre-wrap;">${escapeHtml(data.message)}</div>
</body></html>`,
      })
    }
  } catch (err) {
    console.error('[inquiries] email send failed (inquiry still saved):', err)
  }

  return NextResponse.json({ id: created.id, status: 'new' }, { status: 201 })
}
