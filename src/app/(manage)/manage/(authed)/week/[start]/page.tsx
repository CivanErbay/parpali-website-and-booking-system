import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../../manage.module.css'
import { DateNav } from '@/components/Manage/DateNav/DateNav'
import { WeekBoard } from '@/components/Manage/WeekBoard/WeekBoard'
import { addDays, isValidIso, isoToday, weekStart, weekDays } from '@/lib/dashboard'
import { mapManageReservations } from '@/lib/bookingContext'

export const dynamic = 'force-dynamic'

export default async function WeekPage({ params }: { params: Promise<{ start: string }> }) {
  const { start: raw } = await params
  if (!isValidIso(raw)) redirect(`/manage/week/${weekStart(isoToday())}`)
  const start = weekStart(raw)
  const days = weekDays(start)

  const payload = await getPayload({ config })
  const resvResp = await payload.find({
    collection: 'reservations',
    where: {
      date: { greater_than_equal: start, less_than: addDays(start, 7) },
    },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const reservations = mapManageReservations(resvResp.docs)

  // resvResp docs keep their raw date; group by YYYY-MM-DD.
  const dateByIndex = new Map<string, string>()
  for (const d of resvResp.docs) {
    dateByIndex.set(String(d.id), String(d.date).slice(0, 10))
  }
  const grouped = days.map((date) => ({
    date,
    reservations: reservations.filter((r) => dateByIndex.get(r.id) === date),
  }))

  const totalReservations = reservations.filter((r) => r.status !== 'cancelled').length
  const totalGuests = reservations
    .filter((r) => r.status !== 'cancelled')
    .reduce((s, r) => s + r.partySize, 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Wochenübersicht</p>
          <DateNav date={start} kind="week" />
        </div>
        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiValue}>{totalReservations}</div>
            <div className={styles.kpiLabel}>Reservierungen</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiValue}>{totalGuests}</div>
            <div className={styles.kpiLabel}>Gäste</div>
          </div>
        </div>
      </header>

      <WeekBoard days={grouped} today={isoToday()} />
    </div>
  )
}
