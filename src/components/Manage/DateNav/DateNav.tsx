'use client'

import { useRouter } from 'next/navigation'
import styles from './DateNav.module.css'
import { addDays, isoToday, weekStart, formatLongDate } from '../../../lib/dashboard'

/** Prev / today / next + a date picker for the day and week views. */
export function DateNav({ date, kind }: { date: string; kind: 'day' | 'week' }) {
  const router = useRouter()
  const step = kind === 'week' ? 7 : 1

  const go = (d: string) => {
    const target = kind === 'week' ? weekStart(d) : d
    router.push(kind === 'week' ? `/manage/week/${target}` : `/manage/day/${target}`)
  }

  const label = kind === 'week' ? `Woche ab ${formatLongDate(date)}` : formatLongDate(date)

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => go(addDays(date, -step))}
        aria-label={kind === 'week' ? 'Vorige Woche' : 'Voriger Tag'}
      >
        ‹
      </button>
      <button type="button" className={styles.today} onClick={() => go(isoToday())}>
        Heute
      </button>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => go(addDays(date, step))}
        aria-label={kind === 'week' ? 'Nächste Woche' : 'Nächster Tag'}
      >
        ›
      </button>
      <span className={styles.label}>{label}</span>
      <input
        type="date"
        className={styles.picker}
        value={date}
        onChange={(e) => e.target.value && go(e.target.value)}
        aria-label="Datum wählen"
      />
    </div>
  )
}
