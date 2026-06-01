'use client'

import { useState } from 'react'
import styles from './TablesManager.module.css'

export interface TableRow {
  id: string
  label: string
  capacity: number
  zone: string
  sortOrder: number
  combinable: boolean
  active: boolean
  combinesWith: string[]
}

/** Editable row — only the fields the owner actually manages. Combining is
 * preconfigured and intentionally not surfaced here; `sortOrder` follows the
 * row's position in the list (no raw number to type). */
interface EditableTable {
  _key: string
  id: string
  label: string
  capacity: number
  zone: 'main' | 'terrace' // main = Innen, terrace = Außen
  active: boolean
  dirty: boolean
}

let keyCounter = 0
const newKey = () => `t${Date.now()}_${keyCounter++}`

const toZone = (z: string): 'main' | 'terrace' => (z === 'terrace' ? 'terrace' : 'main')

export function TablesManager({ initial }: { initial: TableRow[] }) {
  const [rows, setRows] = useState<EditableTable[]>(
    initial.map((t) => ({
      _key: newKey(),
      id: t.id,
      label: t.label,
      capacity: t.capacity,
      zone: toZone(t.zone),
      active: t.active,
      dirty: false,
    })),
  )
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const dirtyCount = rows.filter((r) => r.dirty).length

  const patch = (key: string, p: Partial<EditableTable>) =>
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...p, dirty: true } : r)))

  const move = (key: string, dir: -1 | 1) =>
    setRows((rs) => {
      const i = rs.findIndex((r) => r._key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= rs.length) return rs
      const next = [...rs]
      ;[next[i], next[j]] = [next[j], next[i]]
      next[i] = { ...next[i], dirty: true }
      next[j] = { ...next[j], dirty: true }
      return next
    })

  const add = () =>
    setRows((rs) => [
      ...rs,
      { _key: newKey(), id: '', label: '', capacity: 2, zone: 'main', active: true, dirty: true },
    ])

  async function removeRow(key: string) {
    const row = rows.find((r) => r._key === key)
    if (!row) return
    if (!row.id) {
      setRows((rs) => rs.filter((r) => r._key !== key))
      return
    }
    if (!window.confirm(`Tisch „${row.label || row.id}" wirklich löschen?`)) return
    setBusyKey(key)
    setStatus(null)
    try {
      const res = await fetch(`/api/manage/tables/${row.id}`, { method: 'DELETE' })
      if (res.ok) {
        setRows((rs) => rs.filter((r) => r._key !== key))
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setStatus({ ok: false, msg: data.error ?? 'Löschen fehlgeschlagen.' })
      }
    } catch {
      setStatus({ ok: false, msg: 'Netzwerkfehler.' })
    } finally {
      setBusyKey(null)
    }
  }

  async function saveAll() {
    const missing = rows.find((r) => r.dirty && r.label.trim().length < 1)
    if (missing) {
      setStatus({ ok: false, msg: 'Bitte allen Tischen einen Namen geben.' })
      return
    }
    setSaving(true)
    setStatus(null)
    let saved = 0
    try {
      // Sequential so an error points at a concrete table; sortOrder = position.
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row.dirty) continue
        const url = row.id ? `/api/manage/tables/${row.id}` : '/api/manage/tables'
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            label: row.label.trim(),
            capacity: row.capacity,
            zone: row.zone,
            active: row.active,
            sortOrder: i,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
        if (!res.ok) {
          setStatus({ ok: false, msg: `„${row.label}": ${data.error ?? 'Fehler beim Speichern.'}` })
          return
        }
        const newId = !row.id && data.id ? data.id : row.id
        setRows((rs) => rs.map((r) => (r._key === row._key ? { ...r, id: newId, dirty: false } : r)))
        saved++
      }
      setStatus({ ok: true, msg: saved === 0 ? 'Keine Änderungen.' : `${saved} Tisch(e) gespeichert.` })
    } catch {
      setStatus({ ok: false, msg: 'Netzwerkfehler.' })
    } finally {
      setSaving(false)
    }
  }

  const activeCount = rows.filter((r) => r.active).length
  const seats = rows.filter((r) => r.active).reduce((s, r) => s + r.capacity, 0)

  return (
    <div className={styles.root}>
      <p className={styles.intro}>
        Hier verwaltest du eure Tische. Lege fest, wie viele <strong>Plätze</strong> jeder Tisch hat
        und ob er <strong>innen</strong> oder <strong>außen</strong> steht. Ein Tisch gerade nicht
        buchbar (z.&nbsp;B. defekt)? Einfach auf <strong>inaktiv</strong> stellen. Mit den Pfeilen
        änderst du die Reihenfolge im Tagesplan.
      </p>

      <div className={styles.summary}>
        {activeCount} aktive Tische · {seats} Plätze
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>Noch keine Tische angelegt.</p>
          <button type="button" className={styles.addBtn} onClick={add}>
            + Ersten Tisch hinzufügen
          </button>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((r, i) => (
            <li key={r._key} className={r.active ? styles.row : `${styles.row} ${styles.rowInactive}`}>
              <div className={styles.order}>
                <button type="button" className={styles.orderBtn} disabled={i === 0} aria-label="Nach oben" onClick={() => move(r._key, -1)}>↑</button>
                <button type="button" className={styles.orderBtn} disabled={i === rows.length - 1} aria-label="Nach unten" onClick={() => move(r._key, 1)}>↓</button>
              </div>

              <label className={styles.nameField}>
                <span className={styles.fieldLabel}>Tisch</span>
                <input
                  type="text"
                  className={styles.nameInput}
                  placeholder="z. B. T1"
                  value={r.label}
                  onChange={(e) => patch(r._key, { label: e.target.value })}
                />
              </label>

              <div className={styles.seatsField}>
                <span className={styles.fieldLabel}>Plätze</span>
                <div className={styles.stepper}>
                  <button type="button" className={styles.stepBtn} aria-label="Weniger Plätze" onClick={() => patch(r._key, { capacity: Math.max(1, r.capacity - 1) })}>−</button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    className={styles.stepInput}
                    value={r.capacity}
                    onChange={(e) => patch(r._key, { capacity: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })}
                  />
                  <button type="button" className={styles.stepBtn} aria-label="Mehr Plätze" onClick={() => patch(r._key, { capacity: Math.min(20, r.capacity + 1) })}>+</button>
                </div>
              </div>

              <div className={styles.zoneField}>
                <span className={styles.fieldLabel}>Bereich</span>
                <div className={styles.segmented} role="group" aria-label="Bereich">
                  <button type="button" className={r.zone === 'main' ? `${styles.segBtn} ${styles.segOn}` : styles.segBtn} aria-pressed={r.zone === 'main'} onClick={() => patch(r._key, { zone: 'main' })}>Innen</button>
                  <button type="button" className={r.zone === 'terrace' ? `${styles.segBtn} ${styles.segOn}` : styles.segBtn} aria-pressed={r.zone === 'terrace'} onClick={() => patch(r._key, { zone: 'terrace' })}>Außen</button>
                </div>
              </div>

              <div className={styles.activeField}>
                <span className={styles.fieldLabel}>Buchbar</span>
                <button
                  type="button"
                  className={r.active ? `${styles.toggle} ${styles.toggleOn}` : styles.toggle}
                  role="switch"
                  aria-checked={r.active}
                  onClick={() => patch(r._key, { active: !r.active })}
                >
                  <span className={styles.toggleKnob} aria-hidden="true" />
                  <span className={styles.toggleText}>{r.active ? 'Aktiv' : 'Inaktiv'}</span>
                </button>
              </div>

              <button
                type="button"
                className={styles.deleteBtn}
                disabled={busyKey === r._key}
                aria-label={`Tisch ${r.label || ''} löschen`}
                onClick={() => removeRow(r._key)}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 ? (
        <button type="button" className={styles.addBtn} onClick={add}>
          + Tisch hinzufügen
        </button>
      ) : null}

      <div className={styles.saveBar}>
        <button type="button" className={styles.saveBtn} disabled={saving || dirtyCount === 0} onClick={saveAll}>
          {saving ? 'Speichern …' : dirtyCount > 0 ? `Alle Änderungen speichern (${dirtyCount})` : 'Gespeichert'}
        </button>
        {status ? (
          <span className={status.ok ? `${styles.status} ${styles.statusOk}` : `${styles.status} ${styles.statusErr}`} role="status">
            {status.msg}
          </span>
        ) : null}
      </div>
    </div>
  )
}
