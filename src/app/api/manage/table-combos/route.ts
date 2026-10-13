import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'

interface ComboInput {
  tables: string[]
  minParty: number | null
  maxParty: number
}

const partyNum = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 40 ? n : null
}

/** Validate the full combo list; returns the first problem as a German message. */
export function parseCombos(body: unknown): { ok: true; data: ComboInput[] } | { ok: false; error: string } {
  const raw = (body as { combos?: unknown } | null)?.combos
  if (!Array.isArray(raw)) return { ok: false, error: 'Ungültige Anfrage.' }

  const data: ComboInput[] = []
  for (const c of raw) {
    const r = (c ?? {}) as Record<string, unknown>
    const ids = Array.isArray(r.tableIds) ? r.tableIds.filter((x): x is string => typeof x === 'string') : []
    const tables = [...new Set(ids)]
    if (tables.length < 2) return { ok: false, error: 'Jede Kombination braucht mindestens zwei Tische.' }

    const maxParty = partyNum(r.maxParty)
    if (maxParty === null) return { ok: false, error: '„Bis Personen" muss zwischen 1 und 40 liegen.' }
    const minParty = r.minParty == null || r.minParty === '' ? null : partyNum(r.minParty)
    if (r.minParty != null && r.minParty !== '' && minParty === null) {
      return { ok: false, error: '„Ab Personen" muss zwischen 1 und 40 liegen.' }
    }
    if (minParty !== null && minParty > maxParty) {
      return { ok: false, error: '„Ab Personen" darf nicht größer als „Bis Personen" sein.' }
    }
    data.push({ tables, minParty, maxParty })
  }
  return { ok: true, data }
}

/** POST /api/manage/table-combos — replace the allowed table combinations. */
export async function POST(req: Request): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const parsed = parseCombos(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    try {
      await payload.updateGlobal({
        slug: 'booking-settings',
        overrideAccess: true,
        data: { tableCombos: parsed.data },
      })
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('[manage/table-combos] save failed:', err)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 400 })
    }
  })
}
