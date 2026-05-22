'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import styles from './ReservationFilters.module.css'
import { STATUS_LABELS } from '../../../lib/dashboard'

/** Filter bar for the reservation list — pushes its state into the URL. */
export function ReservationFilters() {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')

  function apply(overrides: Record<string, string>) {
    const next = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    router.push(`/manage/reservations?${next.toString()}`)
  }

  return (
    <form
      className={styles.root}
      onSubmit={(e) => {
        e.preventDefault()
        apply({ q })
      }}
    >
      <input
        type="search"
        className={styles.search}
        placeholder="Name suchen …"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Nach Name suchen"
      />
      <select
        className={styles.select}
        defaultValue={sp.get('range') ?? 'upcoming'}
        onChange={(e) => apply({ range: e.target.value })}
        aria-label="Zeitraum"
      >
        <option value="upcoming">Kommende</option>
        <option value="past">Vergangene</option>
        <option value="all">Alle</option>
      </select>
      <select
        className={styles.select}
        defaultValue={sp.get('status') ?? ''}
        onChange={(e) => apply({ status: e.target.value })}
        aria-label="Status"
      >
        <option value="">Alle Status</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button type="submit" className={styles.apply}>
        Suchen
      </button>
    </form>
  )
}
