'use client'

import { useState } from 'react'
import styles from './TablesManager.module.css'
import own from './TableCombosManager.module.css'

export interface ComboRow {
  tableIds: string[]
  minParty: number | null
  maxParty: number
}

interface EditableCombo extends ComboRow {
  _key: string
}

let keyCounter = 0
const newKey = () => `c${Date.now()}_${keyCounter++}`

const clamp = (n: number) => Math.min(40, Math.max(1, n))

/**
 * Pflege der erlaubten Tisch-Kombinationen. Nur diese Gruppen stellt das System
 * zusammen — jede mit eigener Personenzahl, weil die Plätze nicht einfach die
 * Summe der Einzeltische sind (Tisch 1 + 2 = 4, aber 1 + 2 + 3 = 12).
 */
export function TableCombosManager({
  tables,
  initial,
}: {
  tables: { id: string; label: string }[]
  initial: ComboRow[]
}) {
  const [rows, setRows] = useState<EditableCombo[]>(initial.map((c) => ({ ...c, _key: newKey() })))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const labelOf = new Map(tables.map((t) => [t.id, t.label]))

  const patch = (key: string, p: Partial<EditableCombo>) => {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...p } : r)))
    setDirty(true)
  }

  const toggleTable = (key: string, id: string) => {
    const row = rows.find((r) => r._key === key)
    if (!row) return
    const has = row.tableIds.includes(id)
    // Keep the owner's numbering order (= table list order) instead of click order.
    const next = has ? row.tableIds.filter((x) => x !== id) : tables.map((t) => t.id).filter((t) => t === id || row.tableIds.includes(t))
    patch(key, { tableIds: next })
  }

  const add = () => {
    setRows((rs) => [...rs, { _key: newKey(), tableIds: [], minParty: null, maxParty: 4 }])
    setDirty(true)
  }

  const remove = (key: string) => {
    setRows((rs) => rs.filter((r) => r._key !== key))
    setDirty(true)
  }

  async function save() {
    const bad = rows.find((r) => r.tableIds.length < 2)
    if (bad) {
      setStatus({ ok: false, msg: 'Jede Kombination braucht mindestens zwei Tische.' })
      return
    }
    const badRange = rows.find((r) => r.minParty != null && r.minParty > r.maxParty)
    if (badRange) {
      setStatus({ ok: false, msg: '„Ab Personen" darf nicht größer als „Bis Personen" sein.' })
      return
    }
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/manage/table-combos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          combos: rows.map(({ tableIds, minParty, maxParty }) => ({ tableIds, minParty, maxParty })),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setStatus({ ok: false, msg: data.error ?? 'Speichern fehlgeschlagen.' })
        return
      }
      setDirty(false)
      setStatus({ ok: true, msg: 'Kombinationen gespeichert.' })
    } catch {
      setStatus({ ok: false, msg: 'Netzwerkfehler.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.root}>
      <h2 className={own.title}>Tisch-Kombinationen</h2>
      <p className={styles.intro}>
        Welche Tische dürfen für größere Gruppen <strong>zusammengeschoben</strong> werden? Das System
        nutzt <strong>nur</strong> die Kombinationen, die hier stehen — alle anderen Tische bleiben
        einzeln. Pro Kombination legst du fest, für wie viele Personen sie gedacht ist.
      </p>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>Noch keine Kombinationen — es werden nur Einzeltische vergeben.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r._key} className={styles.row}>
              <div className={own.tablesField}>
                <span className={styles.fieldLabel}>
                  Tische
                  {r.tableIds.length > 0 ? (
                    <span className={own.selection}> · {r.tableIds.map((id) => labelOf.get(id) ?? '?').join(' + ')}</span>
                  ) : null}
                </span>
                <div className={own.chips} role="group" aria-label="Tische auswählen">
                  {tables.map((t) => {
                    const on = r.tableIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={on ? `${own.chip} ${own.chipOn}` : own.chip}
                        aria-pressed={on}
                        onClick={() => toggleTable(r._key, t.id)}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <PartyStepper
                label="Ab Personen"
                value={r.minParty}
                optional
                onChange={(v) => patch(r._key, { minParty: v })}
              />
              <PartyStepper
                label="Bis Personen"
                value={r.maxParty}
                onChange={(v) => patch(r._key, { maxParty: v ?? 1 })}
              />

              <button
                type="button"
                className={styles.deleteBtn}
                aria-label="Kombination löschen"
                onClick={() => remove(r._key)}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={styles.addBtn} onClick={add}>
        + Kombination hinzufügen
      </button>

      <div className={styles.saveBar}>
        <button type="button" className={styles.saveBtn} disabled={saving || !dirty} onClick={save}>
          {saving ? 'Speichern …' : dirty ? 'Kombinationen speichern' : 'Gespeichert'}
        </button>
        {status ? (
          <span className={status.ok ? `${styles.status} ${styles.statusOk}` : `${styles.status} ${styles.statusErr}`} role="status">
            {status.msg}
          </span>
        ) : null}
      </div>
    </section>
  )
}

function PartyStepper({
  label,
  value,
  optional = false,
  onChange,
}: {
  label: string
  value: number | null
  optional?: boolean
  onChange: (v: number | null) => void
}) {
  return (
    <div className={styles.seatsField}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepBtn}
          aria-label={`${label}: weniger`}
          onClick={() => onChange(value == null ? null : optional && value <= 1 ? null : clamp(value - 1))}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={40}
          placeholder={optional ? '–' : undefined}
          className={styles.stepInput}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' && optional ? null : clamp(Number(raw) || 1))
          }}
        />
        <button
          type="button"
          className={styles.stepBtn}
          aria-label={`${label}: mehr`}
          onClick={() => onChange(clamp((value ?? 0) + 1))}
        >
          +
        </button>
      </div>
    </div>
  )
}
