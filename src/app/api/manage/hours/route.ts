import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'

const TIME_RE = /^\d{2}:\d{2}$/
type Weekday = '0' | '1' | '2' | '3' | '4' | '5' | '6'
const WEEKDAYS: Weekday[] = ['0', '1', '2', '3', '4', '5', '6']

const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {}

/** POST /api/manage/hours — update the opening-hours global. */
export async function POST(req: Request): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const b = rec(body)

    const regular = (Array.isArray(b.regular) ? b.regular : [])
      .map(rec)
      .filter((r) => WEEKDAYS.includes(String(r.weekday) as Weekday))
      .map((r) => ({
        weekday: String(r.weekday) as Weekday,
        isClosed: Boolean(r.isClosed),
        segments: (Array.isArray(r.segments) ? r.segments : [])
          .map(rec)
          .filter((s) => TIME_RE.test(String(s.open)) && TIME_RE.test(String(s.close)))
          .map((s) => ({
            label: typeof s.label === 'string' && s.label ? s.label : 'Service',
            open: String(s.open),
            close: String(s.close),
          })),
      }))

    const holidays = (Array.isArray(b.holidays) ? b.holidays : [])
      .map(rec)
      .filter((h) => typeof h.date === 'string' && h.date)
      .map((h) => ({
        date: String(h.date),
        label: typeof h.label === 'string' ? h.label : undefined,
        isClosed: Boolean(h.isClosed),
        openOverride: TIME_RE.test(String(h.openOverride)) ? String(h.openOverride) : undefined,
        closeOverride: TIME_RE.test(String(h.closeOverride)) ? String(h.closeOverride) : undefined,
      }))

    try {
      await payload.updateGlobal({
        slug: 'opening-hours',
        overrideAccess: true,
        data: { regular, holidays },
      })
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('[manage/hours] save failed:', err)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 400 })
    }
  })
}
