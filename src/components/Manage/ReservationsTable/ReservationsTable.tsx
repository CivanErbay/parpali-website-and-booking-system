import Link from 'next/link'
import styles from './ReservationsTable.module.css'
import { STATUS_LABELS, SOURCE_LABELS, formatShortDate } from '../../../lib/dashboard'

export interface ReservationRow {
  id: string
  date: string
  time: string
  name: string
  partySize: number
  status: string
  source: string
  tableLabels: string[]
}

/** Sortable-looking reservation list. Rows link to their day view. */
export function ReservationsTable({ rows }: { rows: ReservationRow[] }) {
  if (rows.length === 0) {
    return <p className={styles.empty}>Keine Reservierungen gefunden.</p>
  }
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Zeit</th>
            <th>Name</th>
            <th>Pers.</th>
            <th>Tische</th>
            <th>Status</th>
            <th>Quelle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/manage/day/${r.date}`} className={styles.dateLink}>
                  {formatShortDate(r.date)}
                </Link>
              </td>
              <td className={styles.mono}>{r.time}</td>
              <td className={styles.name}>{r.name}</td>
              <td className={styles.mono}>{r.partySize}</td>
              <td>{r.tableLabels.length > 0 ? r.tableLabels.join(' + ') : '—'}</td>
              <td>
                <span className={styles.badge} data-status={r.status}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </td>
              <td className={styles.source}>{SOURCE_LABELS[r.source] ?? r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
