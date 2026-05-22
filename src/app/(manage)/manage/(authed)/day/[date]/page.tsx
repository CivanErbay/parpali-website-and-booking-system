import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../../manage.module.css'
import { DateNav } from '@/components/Manage/DateNav/DateNav'
import { DayBoard } from '@/components/Manage/DayBoard/DayBoard'
import { buildDayGrid, isValidIso, isoToday } from '@/lib/dashboard'
import {
  mapPolicy,
  mapOpeningRules,
  mapHolidays,
  mapDashboardTables,
  mapManageReservations,
} from '@/lib/bookingContext'

export const dynamic = 'force-dynamic'

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  if (!isValidIso(date)) redirect(`/manage/day/${isoToday()}`)

  const payload = await getPayload({ config })
  const [settings, hours, tablesResp, resvResp] = await Promise.all([
    payload.findGlobal({ slug: 'booking-settings' }),
    payload.findGlobal({ slug: 'opening-hours' }),
    payload.find({
      collection: 'tables',
      where: { active: { equals: true } },
      limit: 200,
      depth: 0,
      sort: 'sortOrder',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'reservations',
      where: { date: { equals: date } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const policy = mapPolicy(settings)
  const tables = mapDashboardTables(tablesResp.docs)
  const reservations = mapManageReservations(resvResp.docs)

  const grid = buildDayGrid({
    date,
    tables,
    reservations,
    openingRules: mapOpeningRules(hours),
    holidayOverrides: mapHolidays(hours),
    tableHoldMinutes: policy.tableHoldMinutes,
  })

  const tableLite = tables.map((t) => ({
    id: t.id,
    label: t.label,
    capacity: t.capacity,
    zone: t.zone,
  }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Tagesplan</p>
          <DateNav date={date} kind="day" />
        </div>
        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiValue}>{grid.totalReservations}</div>
            <div className={styles.kpiLabel}>Reservierungen</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiValue}>{grid.totalGuests}</div>
            <div className={styles.kpiLabel}>Gäste</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiValue}>{grid.unassigned.length}</div>
            <div className={styles.kpiLabel}>Ohne Tisch</div>
          </div>
        </div>
      </header>

      <DayBoard grid={grid} date={date} tables={tableLite} />
    </div>
  )
}
