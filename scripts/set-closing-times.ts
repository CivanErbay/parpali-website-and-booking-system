/**
 * Set the displayed closing time of each open day to one hour after its last
 * seating (the restaurant is open until ~22:00/23:00, but the last reservation
 * is an hour earlier). lastSeating drives the bookable slots and stays
 * untouched — only `close` (the public opening-hours display) changes.
 * Read-modify-write; everything else (open times, lastSeating, holidays) is
 * preserved. Pass --dry to preview without writing.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-closing-times.ts --dry
 *   pnpm tsx --env-file=.env.local scripts/set-closing-times.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const plusOneHour = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

async function main() {
  const dry = process.argv.includes('--dry')
  const payload = await getPayload({ config })
  const current = (await payload.findGlobal({ slug: 'opening-hours' })) as Record<string, unknown>
  const { id, _id, createdAt, updatedAt, globalType, ...rest } = current
  void id; void _id; void createdAt; void updatedAt; void globalType

  const regular = (Array.isArray(rest.regular) ? rest.regular : []).map((r) => {
    const rule = (r ?? {}) as Record<string, unknown>
    const segments = Array.isArray(rule.segments) ? rule.segments : []
    if (rule.isClosed || segments.length === 0) {
      console.log(`wd=${rule.weekday}: geschlossen / keine Segmente — unverändert`)
      return rule
    }
    const next = segments.map((s) => {
      const seg = (s ?? {}) as Record<string, unknown>
      if (typeof seg.lastSeating === 'string' && seg.lastSeating) {
        const close = plusOneHour(seg.lastSeating)
        console.log(`wd=${rule.weekday}: ${seg.open}–${seg.close} (letzte ${seg.lastSeating}) → Schluss ${close}`)
        return { ...seg, close }
      }
      console.log(`wd=${rule.weekday}: ${seg.open}–${seg.close} (kein lastSeating — unverändert)`)
      return seg
    })
    return { ...rule, segments: next }
  })

  if (dry) {
    console.log('\nDRY-RUN — nichts geschrieben.')
    process.exit(0)
  }
  await payload.updateGlobal({
    slug: 'opening-hours',
    overrideAccess: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { ...(rest as any), regular },
  })
  console.log('\nopening-hours aktualisiert.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
