import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { ReservationFilters } from '@/components/Manage/ReservationFilters/ReservationFilters'
import { ReservationsTable, type ReservationRow } from '@/components/Manage/ReservationsTable/ReservationsTable'
import { isoToday } from '@/lib/dashboard'
import { mapManageReservations } from '@/lib/bookingContext'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  status?: string
  range?: string
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const today = isoToday()
  const range = sp.range ?? 'upcoming'

  const and: Where[] = []
  if (range === 'upcoming') and.push({ date: { greater_than_equal: today } })
  else if (range === 'past') and.push({ date: { less_than: today } })
  if (sp.status) and.push({ status: { equals: sp.status } })
  if (sp.q) and.push({ name: { like: sp.q } })

  const payload = await getPayload({ config })
  const [resvResp, tablesResp] = await Promise.all([
    payload.find({
      collection: 'reservations',
      where: and.length > 0 ? { and } : {},
      sort: range === 'upcoming' ? ['date', 'time'] : ['-date', '-time'],
      limit: 300,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({ collection: 'tables', limit: 200, depth: 0, overrideAccess: true }),
  ])

  const labelById = new Map<string, string>()
  for (const t of tablesResp.docs) labelById.set(String(t.id), String(t.label))

  const dateById = new Map<string, string>()
  for (const d of resvResp.docs) dateById.set(String(d.id), String(d.date).slice(0, 10))

  const rows: ReservationRow[] = mapManageReservations(resvResp.docs).map((r) => ({
    id: r.id,
    date: dateById.get(r.id) ?? today,
    time: r.time,
    name: r.name,
    partySize: r.partySize,
    status: r.status,
    source: r.source ?? 'web',
    tableLabels: r.tableIds.map((id) => labelById.get(id) ?? id),
  }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Reservierungen</p>
          <h1 className={styles.title}>Alle Reservierungen</h1>
          <p className={styles.subtitle}>{rows.length} Einträge</p>
        </div>
      </header>

      <ReservationFilters />
      <ReservationsTable rows={rows} />
    </div>
  )
}
