'use client'

/**
 * View switcher for the day page (ADR-0015). Defaults to the touch-first
 * run-sheet (the host-stand primary view); the timeline grid stays one tap
 * away for desktop planning. Choice persists per device in localStorage.
 */
import { useEffect, useState } from 'react'
import styles from './DayView.module.css'
import { RunSheet } from '../RunSheet/RunSheet'
import { DayBoard } from '../DayBoard/DayBoard'
import type { DayGrid } from '../../../lib/dashboard'

interface TableLite {
  id: string
  label: string
  capacity: number
  zone: string
}

type View = 'list' | 'grid'
const STORAGE_KEY = 'parpali.manage.dayView'

export function DayView({ grid, date, tables }: { grid: DayGrid; date: string; tables: TableLite[] }) {
  const [view, setView] = useState<View>('list')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  const choose = (v: View) => {
    setView(v)
    window.localStorage.setItem(STORAGE_KEY, v)
  }

  return (
    <div className={styles.root}>
      <div className={styles.toggle} role="tablist" aria-label="Ansicht">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'list'}
          className={view === 'list' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => choose('list')}
        >
          Liste
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'grid'}
          className={view === 'grid' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => choose('grid')}
        >
          Zeitplan
        </button>
      </div>

      {view === 'list' ? (
        <RunSheet grid={grid} date={date} tables={tables} />
      ) : (
        <DayBoard grid={grid} date={date} tables={tables} />
      )}
    </div>
  )
}
