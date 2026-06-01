'use client'

/**
 * Token-styled date picker for the booking form. Replaces the native
 * <input type="date"> which (a) couldn't be themed to the CI colours and
 * (b) on Chrome only opened from the tiny calendar glyph, not the field.
 *
 * A real <button> trigger (opens on the whole control), a CSS-animated popover
 * calendar in the Parpali palette, Monday-first weeks, past dates disabled.
 * No new dependency — built on the existing React + CSS-tokens stack.
 */
import { useEffect, useId, useRef, useState } from 'react'
import styles from './DatePicker.module.css'

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (iso: string) => void
  min?: string // YYYY-MM-DD, earliest selectable (inclusive)
  ariaLabel?: string
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const pad = (n: number) => String(n).padStart(2, '0')
const fmtIso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()
/** Monday-based weekday index (0 = Mon … 6 = Sun) for the 1st of a month. */
const firstWeekdayMon = (y: number, m: number) => (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7

const longDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
const monthLabel = (y: number, m: number): string =>
  new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

export function DatePicker({ value, onChange, min, ariaLabel = 'Datum' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const base = value || min || ''
    const [y, m] = base ? base.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
    return { y, m }
  })
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popId = useId()

  // Close on outside click / Escape; return focus to the trigger on Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (!open && value) {
      const [y, m] = value.split('-').map(Number)
      setView({ y, m })
    }
    setOpen((o) => !o)
  }

  const select = (iso: string) => {
    onChange(iso)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const minY = min ? Number(min.slice(0, 4)) : -Infinity
  const minM = min ? Number(min.slice(5, 7)) : -Infinity
  const atMinMonth = min ? view.y < minY || (view.y === minY && view.m <= minM) : false

  const step = (dir: -1 | 1) =>
    setView((v) => {
      let m = v.m + dir
      let y = v.y
      if (m < 1) { m = 12; y -= 1 }
      if (m > 12) { m = 1; y += 1 }
      return { y, m }
    })

  const lead = firstWeekdayMon(view.y, view.m)
  const total = daysInMonth(view.y, view.m)
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        onClick={toggle}
      >
        <span className={styles.triggerText}>{value ? longDate(value) : 'Datum wählen'}</span>
        <svg className={styles.icon} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className={styles.pop} id={popId} role="dialog" aria-label={`${ariaLabel} auswählen`}>
          <div className={styles.head}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => step(-1)}
              disabled={atMinMonth}
              aria-label="Vorheriger Monat"
            >
              ‹
            </button>
            <span className={styles.monthLabel} aria-live="polite">{monthLabel(view.y, view.m)}</span>
            <button type="button" className={styles.navBtn} onClick={() => step(1)} aria-label="Nächster Monat">
              ›
            </button>
          </div>

          <div className={styles.weekdays} aria-hidden="true">
            {WEEKDAYS.map((w) => (
              <span key={w} className={styles.weekday}>{w}</span>
            ))}
          </div>

          <div className={styles.grid} role="grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`b${i}`} className={styles.blank} />
              const iso = fmtIso(view.y, view.m, day)
              const disabled = min ? iso < min : false
              const selected = iso === value
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  className={
                    selected ? `${styles.day} ${styles.daySelected}` : styles.day
                  }
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => select(iso)}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
