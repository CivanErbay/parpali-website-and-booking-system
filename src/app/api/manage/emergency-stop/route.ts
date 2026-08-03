import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'

/** POST /api/manage/emergency-stop — Notknopf: toggle the booking-settings global. */
export async function POST(req: Request): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const b = (body ?? {}) as Record<string, unknown>
    const active = Boolean(b.active)
    const message = typeof b.message === 'string' ? b.message.trim() : undefined

    try {
      await payload.updateGlobal({
        slug: 'booking-settings',
        overrideAccess: true,
        data: {
          emergencyStop: active,
          emergencyStopMessage: active ? message : undefined,
        },
      })
      return NextResponse.json({ ok: true, active })
    } catch (err) {
      console.error('[manage/emergency-stop] save failed:', err)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 400 })
    }
  })
}
