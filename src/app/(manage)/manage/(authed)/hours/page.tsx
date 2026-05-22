import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { mapOpeningRules, mapHolidays } from '@/lib/bookingContext'

export const dynamic = 'force-dynamic'

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
  { value: 0, label: 'Sonntag' },
]

export default async function HoursPage() {
  const payload = await getPayload({ config })
  const hours = await payload.findGlobal({ slug: 'opening-hours' })
  const rules = mapOpeningRules(hours)
  const holidays = mapHolidays(hours)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Konfiguration</p>
          <h1 className={styles.title}>Öffnungszeiten</h1>
          <p className={styles.subtitle}>Bestimmen, wann Online-Reservierungen möglich sind.</p>
        </div>
      </header>

      <div className={styles.adminNote}>
        <span>Öffnungszeiten und Feiertage bearbeiten:</span>
        <a className={styles.ghostBtn} href="/admin/globals/opening-hours" target="_blank" rel="noreferrer">
          Im Admin bearbeiten
        </a>
      </div>

      <div className={styles.card}>
        <dl className={styles.dl}>
          {WEEKDAYS.map((wd) => {
            const rule = rules.find((r) => r.weekday === wd.value)
            const closed = !rule || rule.isClosed || rule.segments.length === 0
            return (
              <div key={wd.value} className={styles.dlRow}>
                <dt className={styles.dlKey}>{wd.label}</dt>
                <dd className={styles.dlVal}>
                  {closed
                    ? 'Ruhetag'
                    : rule!.segments.map((s) => `${s.open}–${s.close}`).join('  ·  ')}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Feiertage & Sondertage</h2>
        {holidays.length === 0 ? (
          <p className={styles.empty}>Keine Sondertage hinterlegt.</p>
        ) : (
          <div className={styles.card}>
            <dl className={styles.dl}>
              {holidays.map((h) => (
                <div key={h.date} className={styles.dlRow}>
                  <dt className={styles.dlKey}>{h.date}</dt>
                  <dd className={styles.dlVal}>
                    {h.isClosed
                      ? 'Geschlossen'
                      : h.openOverride && h.closeOverride
                        ? `${h.openOverride}–${h.closeOverride}`
                        : 'Reguläre Zeiten'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
    </div>
  )
}
