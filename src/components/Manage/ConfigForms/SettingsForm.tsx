'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './forms.module.css'

export interface SettingsValues {
  slotMinutes: number
  maxSeatsPerSlot: number
  tableHoldMinutes: number
  maxPartyOnline: number
  minLeadTimeHours: number
  advanceWindowDays: number
  maxCombineTables: number
  blackoutDates: { date: string; reason: string }[]
}

type NumKey = Exclude<keyof SettingsValues, 'blackoutDates'>

const NUM_FIELDS: { key: NumKey; label: string; hint: string }[] = [
  { key: 'slotMinutes', label: 'Reservier-Raster (Min)', hint: 'Abstand der buchbaren Zeiten.' },
  { key: 'tableHoldMinutes', label: 'Tisch-Haltezeit (Min)', hint: '150 = 2,5 Stunden.' },
  { key: 'minLeadTimeHours', label: 'Mindest-Vorlaufzeit (Std)', hint: 'Wie kurzfristig online gebucht werden darf.' },
  { key: 'maxPartyOnline', label: 'Max. Gruppe online', hint: 'Größere Gruppen müssen anrufen.' },
  { key: 'advanceWindowDays', label: 'Buchbar im Voraus (Tage)', hint: 'Wie weit in die Zukunft.' },
  { key: 'maxCombineTables', label: 'Max. kombinierte Tische', hint: 'Obergrenze für zusammengestellte Tische.' },
  { key: 'maxSeatsPerSlot', label: 'Gäste-Obergrenze pro Slot', hint: 'Küchen-Taktung — hoch setzen zum Deaktivieren.' },
]

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter()
  const [values, setValues] = useState<SettingsValues>(initial)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const setNum = (key: NumKey, v: number) => setValues((p) => ({ ...p, [key]: v }))

  const addBlackout = () =>
    setValues((p) => ({ ...p, blackoutDates: [...p.blackoutDates, { date: '', reason: '' }] }))
  const setBlackout = (i: number, field: 'date' | 'reason', v: string) =>
    setValues((p) => ({
      ...p,
      blackoutDates: p.blackoutDates.map((b, idx) => (idx === i ? { ...b, [field]: v } : b)),
    }))
  const removeBlackout = (i: number) =>
    setValues((p) => ({ ...p, blackoutDates: p.blackoutDates.filter((_, idx) => idx !== i) }))

  async function save() {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch('/api/manage/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...values,
          blackoutDates: values.blackoutDates.filter((b) => b.date),
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
        <h2 className={styles.sectionTitle}>Reservierungs-Regeln</h2>
        <div className={styles.card}>
          <div className={styles.grid}>
            {NUM_FIELDS.map((f) => (
              <label key={f.key} className={styles.field}>
                <span className={styles.label}>{f.label}</span>
                <input
                  type="number"
                  className={styles.input}
                  value={values[f.key]}
                  onChange={(e) => setNum(f.key, Number(e.target.value))}
                />
                <span className={styles.hint}>{f.hint}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Blackout-Tage</h2>
        <p className={styles.hint}>Tage, an denen keine Online-Buchung möglich ist (z.B. Privatveranstaltung).</p>
        <div className={styles.list}>
          {values.blackoutDates.length === 0 ? (
            <p className={styles.empty}>Keine Blackout-Tage.</p>
          ) : (
            values.blackoutDates.map((b, i) => (
              <div key={i} className={styles.listRow}>
                <div className={styles.rowField}>
                  <span className={styles.label}>Datum</span>
                  <input
                    type="date"
                    className={styles.inlineInput}
                    value={b.date}
                    onChange={(e) => setBlackout(i, 'date', e.target.value)}
                  />
                </div>
                <div className={`${styles.rowField} ${styles.rowFieldGrow}`}>
                  <span className={styles.label}>Grund (optional)</span>
                  <input
                    type="text"
                    className={styles.inlineInput}
                    value={b.reason}
                    onChange={(e) => setBlackout(i, 'reason', e.target.value)}
                  />
                </div>
                <button type="button" className={styles.removeBtn} onClick={() => removeBlackout(i)}>
                  Entfernen
                </button>
              </div>
            ))
          )}
          <button type="button" className={styles.addBtn} onClick={addBlackout}>
            + Blackout-Tag
          </button>
        </div>
      </section>

      <div className={styles.saveBar}>
        <button type="button" className={styles.saveBtn} disabled={busy} onClick={save}>
          {busy ? 'Speichern …' : 'Einstellungen speichern'}
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
