/**
 * One-off, idempotent migration for the per-table booking model (ADR-0012).
 * For every existing reservation it backfills `holdUntil` and `cancelToken`;
 * `assignedTables` is intentionally left empty (the owner assigns legacy
 * reservations from the dashboard day view). It also bumps the stored
 * `tableHoldMinutes` global to 150 — the changed field default only affects
 * fresh installs.
 *
 * Safe to re-run: already-migrated reservations are skipped.
 *
 * Run with:   pnpm migrate:reservations
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const TIME_RE = /^\d{2}:\d{2}$/
const HOLD_MINUTES = 150

async function main() {
  const payload = await getPayload({ config })

  // 1. Bump the stored hold time.
  const settings = await payload.findGlobal({ slug: 'booking-settings' })
  if (Number(settings?.tableHoldMinutes) !== HOLD_MINUTES) {
    await payload.updateGlobal({
      slug: 'booking-settings',
      data: { tableHoldMinutes: HOLD_MINUTES },
    })
    console.log(`· booking-settings.tableHoldMinutes → ${HOLD_MINUTES}`)
  }

  // 2. Backfill holdUntil + cancelToken.
  let page = 1
  let migrated = 0
  let scanned = 0
  for (;;) {
    const res = await payload.find({
      collection: 'reservations',
      limit: 100,
      page,
      depth: 0,
      overrideAccess: true,
    })
    for (const r of res.docs) {
      scanned++
      const patch: Record<string, unknown> = {}

      if (!r.cancelToken) patch.cancelToken = crypto.randomUUID()

      if (!r.holdUntil) {
        const dateStr = r.date ? String(r.date).slice(0, 10) : null
        if (dateStr && typeof r.time === 'string' && TIME_RE.test(r.time)) {
          const start = new Date(`${dateStr}T${r.time}:00.000Z`)
          if (!Number.isNaN(start.getTime())) {
            patch.holdUntil = new Date(start.getTime() + HOLD_MINUTES * 60_000).toISOString()
          }
        }
      }

      if (Object.keys(patch).length > 0) {
        await payload.update({
          collection: 'reservations',
          id: r.id,
          overrideAccess: true,
          data: patch,
        })
        migrated++
      }
    }
    if (!res.hasNextPage) break
    page++
  }

  console.log(`· ${scanned} Reservierung(en) geprüft, ${migrated} migriert`)
  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
