import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { SettingsForm, type SettingsValues } from '@/components/Manage/ConfigForms/SettingsForm'
import { mapPolicy } from '@/lib/bookingContext'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const payload = await getPayload({ config })
  const doc = await payload.findGlobal({ slug: 'booking-settings' })
  const policy = mapPolicy(doc)

  const rawBlackouts = (doc as { blackoutDates?: unknown }).blackoutDates
  const blackoutDates = Array.isArray(rawBlackouts)
    ? rawBlackouts
        .map((b) => (b ?? {}) as Record<string, unknown>)
        .map((b) => ({
          date: b.date ? String(b.date).slice(0, 10) : '',
          reason: typeof b.reason === 'string' ? b.reason : '',
        }))
    : []

  const initial: SettingsValues = {
    slotMinutes: policy.slotMinutes,
    maxSeatsPerSlot: policy.maxSeatsPerSlot,
    tableHoldMinutes: policy.tableHoldMinutes,
    maxPartyOnline: policy.maxPartyOnline,
    minLeadTimeHours: policy.minLeadTimeHours,
    advanceWindowDays: policy.advanceWindowDays,
    maxCombineTables: policy.maxCombineTables,
    blackoutDates,
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Konfiguration</p>
          <h1 className={styles.title}>Einstellungen</h1>
          <p className={styles.subtitle}>Buchungsregeln für Online-Reservierungen.</p>
        </div>
      </header>
      <SettingsForm initial={initial} />
    </div>
  )
}
