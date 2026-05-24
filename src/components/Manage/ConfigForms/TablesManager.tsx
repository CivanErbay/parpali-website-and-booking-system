'use client'

import { useState } from 'react'
import styles from './forms.module.css'

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

interface EditableTable extends TableRow {
  _key: string
}

const ZONES: { value: string; label: string }[] = [
  { value: 'main', label: 'Hauptraum' },
  { value: 'terrace', label: 'Terrasse' },
  { value: 'bar', label: 'Bar' },
  { value: 'private', label: 'Nebenraum' },
]

let keyCounter = 0
const newKey = () => `t${Date.now()}_${keyCounter++}`

export function TablesManager({ initial }: { initial: TableRow[] }) {
  const [tables, setTables] = useState<EditableTable[]>(
    initial.map((t) => ({ ...t, _key: newKey() })),
  )
  const [status, setStatus] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const update = (key: string, patch: Partial<EditableTable>) =>
    setTables((p) => p.map((t) => (t._key === key ? { ...t, ...patch } : t)))

  const add = () =>
    setTables((p) => [
      ...p,
      {
        _key: newKey(),
        id: '',
        label: '',
        capacity: 2,
        zone: 'main',
        sortOrder: p.length + 1,
        combinable: false,
        active: true,
        combinesWith: [],
      },
    ])

  async function save(key: string) {
    const table = tables.find((t) => t._key === key)
    if (!table) return
    setBusyKey(key)
    setStatus((s) => ({ ...s, [key]: { ok: true, msg: '' } }))
    const url = table.id ? `/api/manage/tables/${table.id}` : '/api/manage/tables'
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          label: table.label,
          capacity: table.capacity,
          zone: table.zone,
          sortOrder: table.sortOrder,
          combinable: table.combinable,
          active: table.active,
          combinesWith: table.combinesWith,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!res.ok) {
        setStatus((s) => ({ ...s, [key]: { ok: false, msg: data.error ?? 'Fehler' } }))
      } else {
        if (!table.id && data.id) update(key, { id: data.id })
        setStatus((s) => ({ ...s, [key]: { ok: true, msg: 'Gespeichert.' } }))
      }
    } catch {
      setStatus((s) => ({ ...s, [key]: { ok: false, msg: 'Netzwerkfehler.' } }))
    } finally {
      setBusyKey(null)
    }
  }

  async function remove(key: string) {
    const table = tables.find((t) => t._key === key)
    if (!table) return
    if (!table.id) {
      setTables((p) => p.filter((t) => t._key !== key))
      return
    }
    setBusyKey(key)
    try {
      const res = await fetch(`/api/manage/tables/${table.id}`, { method: 'DELETE' })
      if (res.ok) {
        setTables((p) => p.filter((t) => t._key !== key))
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setStatus((s) => ({ ...s, [key]: { ok: false, msg: data.error ?? 'Löschen fehlgeschlagen.' } }))
      }
    } catch {
      setStatus((s) => ({ ...s, [key]: { ok: false, msg: 'Netzwerkfehler.' } }))
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.list}>
        {tables.length === 0 ? <p className={styles.empty}>Noch keine Tische.</p> : null}
        {tables.map((t) => {
          const st = status[t._key]
          const others = tables.filter((o) => o.id && o.id !== t.id)
          return (
            <div key={t._key} className={styles.tableCard}>
              <div className={styles.tableCardHead}>
                <h3 className={styles.tableCardTitle}>{t.label || 'Neuer Tisch'}</h3>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  disabled={busyKey === t._key}
                  onClick={() => remove(t._key)}
                >
                  Löschen
                </button>
              </div>

              <div className={styles.grid}>
                <label className={styles.field}>
                  <span className={styles.label}>Tischname</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={t.label}
                    onChange={(e) => update(t._key, { label: e.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Plätze</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={styles.input}
                    value={t.capacity}
                    onChange={(e) => update(t._key, { capacity: Number(e.target.value) })}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Bereich</span>
                  <select
                    className={styles.select}
                    value={t.zone}
                    onChange={(e) => update(t._key, { zone: e.target.value })}
                  >
                    {ZONES.map((z) => (
                      <option key={z.value} value={z.value}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Reihenfolge</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={t.sortOrder}
                    onChange={(e) => update(t._key, { sortOrder: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div className={styles.grid}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={t.active}
                    onChange={(e) => update(t._key, { active: e.target.checked })}
                  />
                  Aktiv (buchbar)
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={t.combinable}
                    onChange={(e) => update(t._key, { combinable: e.target.checked })}
                  />
                  Kombinierbar
                </label>
              </div>

              {t.combinable ? (
                <div className={styles.field}>
                  <span className={styles.label}>Kombinierbar mit (benachbarte Tische)</span>
                  {others.length === 0 ? (
                    <span className={styles.hint}>Erst weitere Tische speichern.</span>
                  ) : (
                    <div className={styles.checkGrid}>
                      {others.map((o) => (
                        <label key={o.id} className={styles.check}>
                          <input
                            type="checkbox"
                            checked={t.combinesWith.includes(o.id)}
                            onChange={(e) =>
                              update(t._key, {
                                combinesWith: e.target.checked
                                  ? [...t.combinesWith, o.id]
                                  : t.combinesWith.filter((x) => x !== o.id),
                              })
                            }
                          />
                          {o.label || o.id}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div className={styles.saveBar}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  disabled={busyKey === t._key}
                  onClick={() => save(t._key)}
                >
                  {busyKey === t._key ? 'Speichern …' : 'Tisch speichern'}
                </button>
                {st && st.msg ? (
                  <span
                    className={`${styles.status} ${st.ok ? styles.statusOk : styles.statusErr}`}
                    role="status"
                  >
                    {st.msg}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <button type="button" className={styles.addBtn} onClick={add}>
        + Neuer Tisch
      </button>
    </div>
  )
}
