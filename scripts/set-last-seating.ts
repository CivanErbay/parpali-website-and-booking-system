/**
 * One-off: set the "last seating" (lastSeating) on the live opening-hours so
 * online bookings run to 21:00 on weekdays / 22:00 at the weekend, regardless
 * of the displayed closing time. Read-modify-write — every other field
 * (segments, holidays, labels) is preserved. Idempotent; safe to re-run.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-last-seating.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Fri (5) + Sat (6) → 22:00; all other open days → 21:00.
const lastSeatingFor = (weekday: string): string => (weekday === '5' || weekday === '6' ? '22:00' : '21:00')

async function main() {
  const payload = await getPayload({ config })
  const current = (await payload.findGlobal({ slug: 'opening-hours' })) as Record<string, unknown>
  const { id, _id, createdAt, updatedAt, globalType, ...rest } = current
  void id; void _id; void createdAt; void updatedAt; void globalType

  const regular = (Array.isArray(rest.regular) ? rest.regular : []).map((r) => {
    const rule = (r ?? {}) as Record<string, unknown>
    const weekday = String(rule.weekday)
    const segments = Array.isArray(rule.segments) ? rule.segments : []
    if (rule.isClosed || segments.length === 0) return rule
    // Only the latest (dinner) segment gets the cap — a lunch segment keeps its
    // own close so it doesn't bleed into the afternoon.
    const lastSeating = lastSeatingFor(weekday)
    const next = segments.map((s, i) => {
      const seg = (s ?? {}) as Record<string, unknown>
      return i === segments.length - 1 ? { ...seg, lastSeating } : seg
    })
    console.log(`  ${weekday}: letzte Reservierung → ${lastSeating}`)
    return { ...rule, segments: next }
  })

  await payload.updateGlobal({
    slug: 'opening-hours',
    overrideAccess: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { ...(rest as any), regular },
  })
  console.log('opening-hours aktualisiert.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
