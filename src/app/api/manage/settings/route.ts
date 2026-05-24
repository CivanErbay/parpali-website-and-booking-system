import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'

/** Validate an integer field within [min, max]; null if invalid. */
function intField(v: unknown, min: number, max: number): number | null {
  const n = Number(v)
  if (!Number.isFinite(n) || n < min || n > max) return null
  return Math.round(n)
}

/** POST /api/manage/settings — update the booking-settings global. */
export async function POST(req: Request): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const b = (body ?? {}) as Record<string, unknown>

    const slotMinutes = intField(b.slotMinutes, 5, 60)
    const maxSeatsPerSlot = intField(b.maxSeatsPerSlot, 1, 100000)
    const tableHoldMinutes = intField(b.tableHoldMinutes, 15, 600)
    const maxPartyOnline = intField(b.maxPartyOnline, 1, 100)
    const minLeadTimeHours = intField(b.minLeadTimeHours, 0, 720)
    const advanceWindowDays = intField(b.advanceWindowDays, 1, 365)
    const maxCombineTables = intField(b.maxCombineTables, 1, 6)

    if (
      slotMinutes === null ||
      maxSeatsPerSlot === null ||
      tableHoldMinutes === null ||
      maxPartyOnline === null ||
      minLeadTimeHours === null ||
      advanceWindowDays === null ||
      maxCombineTables === null
    ) {
      return NextResponse.json(
        { error: 'Bitte alle Felder mit gültigen Werten ausfüllen.' },
        { status: 400 },
      )
    }

    const rawBlackouts = Array.isArray(b.blackoutDates) ? b.blackoutDates : []
    const blackoutDates = rawBlackouts
      .map((x) => (x ?? {}) as Record<string, unknown>)
      .filter((x) => typeof x.date === 'string' && x.date)
      .map((x) => ({
        date: String(x.date),
        reason: typeof x.reason === 'string' ? x.reason : undefined,
      }))

    try {
      await payload.updateGlobal({
        slug: 'booking-settings',
        overrideAccess: true,
        data: {
          slotMinutes,
          maxSeatsPerSlot,
          tableHoldMinutes,
          maxPartyOnline,
          minLeadTimeHours,
          advanceWindowDays,
          maxCombineTables,
          blackoutDates,
        },
      })
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('[manage/settings] save failed:', err)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 400 })
    }
  })
}
