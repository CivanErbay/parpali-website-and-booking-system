'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './forms.module.css'

export interface Segment {
  label: string
  open: string
  close: string
}
export interface WeekdayRule {
  weekday: string
  isClosed: boolean
  segments: Segment[]
}
export interface Holiday {
  date: string
  label: string
  isClosed: boolean
  openOverride: string
  closeOverride: string
}

const WEEKDAY_NAMES: Record<string, string> = {
  '1': 'Montag',
  '2': 'Dienstag',
  '3': 'Mittwoch',
  '4': 'Donnerstag',
  '5': 'Freitag',
  '6': 'Samstag',
  '0': 'Sonntag',
}

export function HoursForm({
  initialRegular,
  initialHolidays,
}: {
  initialRegular: WeekdayRule[]
  initialHolidays: Holiday[]
}) {
  const router = useRouter()
  const [regular, setRegular] = useState<WeekdayRule[]>(initialRegular)
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const updateDay = (i: number, patch: Partial<WeekdayRule>) =>
    setRegular((p) => p.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  const updateSegment = (di: number, si: number, patch: Partial<Segment>) =>
    setRegular((p) =>
      p.map((d, idx) =>
        idx === di
          ? { ...d, segments: d.segments.map((s, sx) => (sx === si ? { ...s, ...patch } : s)) }
          : d,
      ),
    )
  const addSegment = (di: number) =>
    updateDay(di, {
      segments: [...regular[di].segments, { label: 'Service', open: '18:00', close: '23:00' }],
    })
  const removeSegment = (di: number, si: number) =>
    updateDay(di, { segments: regular[di].segments.filter((_, sx) => sx !== si) })

  const updateHoliday = (i: number, patch: Partial<Holiday>) =>
    setHolidays((p) => p.map((h, idx) => (idx === i ? { ...h, ...patch } : h)))
  const addHoliday = () =>
    setHolidays((p) => [...p, { date: '', label: '', isClosed: true, openOverride: '', closeOverride: '' }])
  const removeHoliday = (i: number) => setHolidays((p) => p.filter((_, idx) => idx !== i))

  async function save() {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch('/api/manage/hours', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          regular,
          holidays: holidays.filter((h) => h.date),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setStatus({ ok: false, msg: data.error ?? 'Speichern fehlgeschlagen.' })
      } else {
        setStatus({ ok: true, msg: 'Gespeichert.' })
        router.refresh()
      }
    } catch {
      setStatus({ ok: false, msg: 'Netzwerkfehler.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.form}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reguläre Öffnungszeiten</h2>
        <div className={styles.list}>
          {regular.map((day, di) => (
            <div key={day.weekday} className={styles.weekday}>
              <div className={styles.weekdayHead}>
                <span className={styles.weekdayName}>{WEEKDAY_NAMES[day.weekday] ?? day.weekday}</span>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={day.isClosed}
                    onChange={(e) => updateDay(di, { isClosed: e.target.checked })}
                  />
                  Ruhetag
                </label>
              </div>

              {!day.isClosed ? (
                <div className={styles.list}>
                  {day.segments.map((seg, si) => (
                    <div key={si} className={styles.listRow}>
                      <div className={`${styles.rowField} ${styles.rowFieldGrow}`}>
                        <span className={styles.label}>Bezeichnung</span>
                        <input
                          type="text"
                          className={styles.inlineInput}
                          value={seg.label}
                          onChange={(e) => updateSegment(di, si, { label: e.target.value })}
                        />
                      </div>
                      <div className={styles.rowField}>
                        <span className={styles.label}>Von</span>
                        <input
                          type="time"
                          className={styles.inlineInput}
                          value={seg.open}
                          onChange={(e) => updateSegment(di, si, { open: e.target.value })}
                        />
                      </div>
                      <div className={styles.rowField}>
                        <span className={styles.label}>Bis</span>
                        <input
                          type="time"
                          className={styles.inlineInput}
                          value={seg.close}
                          onChange={(e) => updateSegment(di, si, { close: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeSegment(di, si)}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                  <button type="button" className={styles.addBtn} onClick={() => addSegment(di)}>
                    + Service-Zeit
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Feiertage & Sondertage</h2>
        <div className={styles.list}>
          {holidays.length === 0 ? <p className={styles.empty}>Keine Sondertage.</p> : null}
          {holidays.map((h, i) => (
            <div key={i} className={styles.listRow}>
              <div className={styles.rowField}>
                <span className={styles.label}>Datum</span>
                <input
                  type="date"
                  className={styles.inlineInput}
                  value={h.date}
                  onChange={(e) => updateHoliday(i, { date: e.target.value })}
                />
              </div>
              <div className={`${styles.rowField} ${styles.rowFieldGrow}`}>
                <span className={styles.label}>Bezeichnung</span>
                <input
                  type="text"
                  className={styles.inlineInput}
                  value={h.label}
                  onChange={(e) => updateHoliday(i, { label: e.target.value })}
                />
              </div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={h.isClosed}
                  onChange={(e) => updateHoliday(i, { isClosed: e.target.checked })}
                />
                Geschlossen
              </label>
              {!h.isClosed ? (
                <>
                  <div className={styles.rowField}>
                    <span className={styles.label}>Von</span>
                    <input
                      type="time"
                      className={styles.inlineInput}
                      value={h.openOverride}
                      onChange={(e) => updateHoliday(i, { openOverride: e.target.value })}
                    />
                  </div>
                  <div className={styles.rowField}>
                    <span className={styles.label}>Bis</span>
                    <input
                      type="time"
                      className={styles.inlineInput}
                      value={h.closeOverride}
                      onChange={(e) => updateHoliday(i, { closeOverride: e.target.value })}
                    />
                  </div>
                </>
              ) : null}
              <button type="button" className={styles.removeBtn} onClick={() => removeHoliday(i)}>
                Entfernen
              </button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addHoliday}>
            + Sondertag
          </button>
        </div>
      </section>

      <div className={styles.saveBar}>
        <button type="button" className={styles.saveBtn} disabled={busy} onClick={save}>
          {busy ? 'Speichern …' : 'Öffnungszeiten speichern'}
        </button>
        {status ? (
          <span className={`${styles.status} ${status.ok ? styles.statusOk : styles.statusErr}`} role="status">
            {status.msg}
          </span>
        ) : null}
      </div>
    </div>
  )
}
