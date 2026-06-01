/**
 * One-off: set the booking-settings slot interval (slotMinutes) without
 * touching any other setting. Read-modify-write so every other field is
 * preserved — safe to run against the live DB.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-slot-minutes.ts 30
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const target = Number(process.argv[2] ?? 30)
  if (![15, 30, 60].includes(target)) {
    console.error(`Refusing unusual interval ${target}; expected 15, 30 or 60.`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const current = (await payload.findGlobal({ slug: 'booking-settings' })) as Record<string, unknown>
  console.log('before: slotMinutes =', current.slotMinutes)

  // Drop auto-managed/system keys, keep everything else intact.
  const { id, _id, createdAt, updatedAt, globalType, ...rest } = current
  void id; void _id; void createdAt; void updatedAt; void globalType

  await payload.updateGlobal({
    slug: 'booking-settings',
    overrideAccess: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { ...(rest as any), slotMinutes: target },
  })

  const after = await payload.findGlobal({ slug: 'booking-settings' })
  console.log('after:  slotMinutes =', (after as Record<string, unknown>).slotMinutes)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
