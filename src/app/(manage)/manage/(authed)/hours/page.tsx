import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { HoursForm, type WeekdayRule, type Holiday } from '@/components/Manage/ConfigForms/HoursForm'

export const dynamic = 'force-dynamic'

const WEEKDAY_ORDER = ['1', '2', '3', '4', '5', '6', '0']

const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {}

export default async function HoursPage() {
  const payload = await getPayload({ config })
  const doc = rec(await payload.findGlobal({ slug: 'opening-hours' }))

  const byWeekday = new Map<string, Record<string, unknown>>()
  for (const r of Array.isArray(doc.regular) ? doc.regular : []) {
    const rr = rec(r)
    byWeekday.set(String(rr.weekday), rr)
  }
  const initialRegular: WeekdayRule[] = WEEKDAY_ORDER.map((wd) => {
    const r = byWeekday.get(wd)
    const segments =
      r && Array.isArray(r.segments)
        ? r.segments
            .map(rec)
            .map((s) => ({
              label: typeof s.label === 'string' && s.label ? s.label : 'Service',
              open: String(s.open ?? ''),
              close: String(s.close ?? ''),
            }))
            .filter((s) => s.open && s.close)
        : []
    return { weekday: wd, isClosed: r ? Boolean(r.isClosed) : true, segments }
  })

  const initialHolidays: Holiday[] = (Array.isArray(doc.holidays) ? doc.holidays : [])
    .map(rec)
    .filter((h) => h.date)
    .map((h) => ({
      date: String(h.date).slice(0, 10),
      label: typeof h.label === 'string' ? h.label : '',
      isClosed: h.isClosed === undefined ? true : Boolean(h.isClosed),
      openOverride: typeof h.openOverride === 'string' ? h.openOverride : '',
      closeOverride: typeof h.closeOverride === 'string' ? h.closeOverride : '',
    }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Konfiguration</p>
          <h1 className={styles.title}>Öffnungszeiten</h1>
          <p className={styles.subtitle}>Bestimmen, wann Online-Reservierungen möglich sind.</p>
        </div>
      </header>
      <HoursForm initialRegular={initialRegular} initialHolidays={initialHolidays} />
    </div>
  )
}
