import Link from 'next/link'
import styles from './WeekBoard.module.css'
import { formatShortDate, type ManageReservation } from '../../../lib/dashboard'

interface WeekDay {
  date: string
  reservations: ManageReservation[]
}

/** Seven-day agenda overview. Each day links to its detailed day view. */
export function WeekBoard({ days, today }: { days: WeekDay[]; today: string }) {
  return (
    <div className={styles.grid}>
      {days.map((d) => {
        const active = d.reservations.filter((r) => r.status !== 'cancelled')
        const guests = active.reduce((s, r) => s + r.partySize, 0)
        const sorted = [...active].sort((a, b) => a.time.localeCompare(b.time))
        return (
          <Link
            key={d.date}
            href={`/manage/day/${d.date}`}
            className={d.date === today ? `${styles.day} ${styles.dayToday}` : styles.day}
          >
            <div className={styles.dayHead}>
              <span className={styles.dayLabel}>{formatShortDate(d.date)}</span>
              <span className={styles.dayCount}>
                {active.length} · {guests}P
              </span>
            </div>
            <div className={styles.dayList}>
              {sorted.slice(0, 9).map((r) => (
                <div key={r.id} className={styles.item} data-status={r.status}>
                  <span className={styles.itemTime}>{r.time}</span>
                  <span className={styles.itemName}>{r.name}</span>
                  <span className={styles.itemParty}>{r.partySize}P</span>
                </div>
              ))}
              {active.length === 0 ? <span className={styles.dayEmpty}>Keine Reservierungen</span> : null}
              {active.length > 9 ? (
                <span className={styles.dayMore}>+{active.length - 9} weitere</span>
              ) : null}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
