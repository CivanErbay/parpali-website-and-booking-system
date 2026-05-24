import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'

const ZONES = ['main', 'terrace', 'bar', 'private'] as const
type Zone = (typeof ZONES)[number]

export interface TableInput {
  label: string
  capacity: number
  zone: Zone
  sortOrder: number
  combinable: boolean
  active: boolean
  combinesWith: string[]
}

/** Validate and normalise a table payload, shared by create and update. */
export function parseTableBody(
  body: unknown,
): { ok: true; data: TableInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const label = typeof b.label === 'string' ? b.label.trim() : ''
  if (label.length < 1) return { ok: false, error: 'Tischname ist erforderlich.' }

  const capacity = Number(b.capacity)
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
    return { ok: false, error: 'Kapazität muss zwischen 1 und 20 liegen.' }
  }

  const zone: Zone = ZONES.includes(b.zone as Zone) ? (b.zone as Zone) : 'main'
  const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Math.round(Number(b.sortOrder)) : 0
  const combinable = Boolean(b.combinable)
  const active = b.active === undefined ? true : Boolean(b.active)
  const combinesWith =
    combinable && Array.isArray(b.combinesWith)
      ? b.combinesWith.filter((x): x is string => typeof x === 'string')
      : []

  return { ok: true, data: { label, capacity, zone, sortOrder, combinable, active, combinesWith } }
}

/** POST /api/manage/tables — create a table. */
export async function POST(req: Request): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const parsed = parseTableBody(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    try {
      const created = await payload.create({
        collection: 'tables',
        overrideAccess: true,
        depth: 0,
        data: parsed.data,
      })
      return NextResponse.json({ id: created.id }, { status: 201 })
    } catch (err) {
      console.error('[manage/tables] create failed:', err)
      return NextResponse.json({ error: 'Tisch konnte nicht angelegt werden.' }, { status: 400 })
    }
  })
}
