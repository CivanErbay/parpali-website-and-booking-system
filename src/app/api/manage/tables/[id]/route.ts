import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'
import { parseTableBody } from '../route'

/** POST /api/manage/tables/:id — update a table. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    const { id } = await params
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const parsed = parseTableBody(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    try {
      await payload.update({
        collection: 'tables',
        id,
        overrideAccess: true,
        depth: 0,
        data: parsed.data,
      })
      return NextResponse.json({ id })
    } catch (err) {
      console.error('[manage/tables] update failed:', err)
      return NextResponse.json({ error: 'Tisch konnte nicht gespeichert werden.' }, { status: 400 })
    }
  })
}

/** DELETE /api/manage/tables/:id — remove a table. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    const { id } = await params
    try {
      await payload.delete({ collection: 'tables', id, overrideAccess: true })
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('[manage/tables] delete failed:', err)
      return NextResponse.json({ error: 'Tisch konnte nicht gelöscht werden.' }, { status: 400 })
    }
  })
}
