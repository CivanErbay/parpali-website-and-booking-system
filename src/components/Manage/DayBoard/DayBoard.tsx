'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './DayBoard.module.css'
import {
  type DayGrid,
  type DayGridReservation,
  minToHhmm,
  STATUS_LABELS,
  STATUS_FLOW,
  SOURCE_LABELS,
} from '../../../lib/dashboard'

interface TableLite {
  id: string
  label: string
  capacity: number
  zone: string
}

interface DayBoardProps {
  grid: DayGrid
  date: string
  tables: TableLite[]
}

const ZONE_LABELS: Record<string, string> = {
  main: 'Innen',
  terrace: 'Außen',
  // legacy values fall back to a sensible label
  bar: 'Innen',
  private: 'Innen',
}

export function DayBoard({ grid, date, tables }: DayBoardProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  // Flat reservation lookup (a combined booking appears in several rows).
  const byId = useMemo(() => {
    const map = new Map<string, DayGridReservation>()
    for (const row of grid.rows) for (const r of row.reservations) map.set(r.id, r)
    for (const r of grid.unassigned) map.set(r.id, r)
    return map
  }, [grid])

  const selected = selectedId ? byId.get(selectedId) ?? null : null
  const range = Math.max(1, grid.endMin - grid.startMin)
  const labelById = new Map(tables.map((t) => [t.id, t.label]))

  async function mutate(url: string, body: unknown) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Aktion fehlgeschlagen.')
        return false
      }
      router.refresh()
      return true
    } catch {
      setError('Netzwerkfehler.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const reassign = (id: string, tableIds: string[]) =>
    mutate(`/api/manage/reservations/${id}/reassign`, { tableIds })
  const changeStatus = (id: string, status: string) =>
    mutate(`/api/manage/reservations/${id}/status`, { status })

  function blockStyle(r: DayGridReservation): React.CSSProperties {
    const left = Math.max(0, ((r.startMin - grid.startMin) / range) * 100)
    const width = Math.min(100 - left, ((r.endMin - r.startMin) / range) * 100)
    return { left: `${left}%`, width: `${width}%` }
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.newBtn} onClick={() => setWalkInOpen(true)}>
          + Neue Reservierung
        </button>
        {!grid.open ? <span className={styles.closedTag}>Ruhetag — Buchungen manuell möglich</span> : null}
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>

      {grid.unassigned.length > 0 ? (
        <div className={styles.tray}>
          <span className={styles.trayLabel}>Ohne Tisch ({grid.unassigned.length})</span>
          <div className={styles.trayItems}>
            {grid.unassigned.map((r) => (
              <button
                key={r.id}
                type="button"
                className={styles.chip}
                data-status={r.status}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', r.id)}
                onClick={() => setSelectedId(r.id)}
              >
                {r.time} · {r.name} · {r.partySize}P
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.gridScroll}>
        <div className={styles.grid}>
          <div className={styles.axisRow}>
            <div className={styles.cornerCell} />
            <div className={styles.axisTrack}>
              {grid.hourTicks.map((t) => (
                <span
                  key={t}
                  className={styles.tick}
                  style={{ left: `${((t - grid.startMin) / range) * 100}%` }}
                >
                  {minToHhmm(t)}
                </span>
              ))}
            </div>
          </div>

          {grid.rows.map((row) => (
            <div key={row.tableId} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <span className={styles.tableLabel}>{row.label}</span>
                <span className={styles.tableMeta}>
                  {row.capacity}P · {ZONE_LABELS[row.zone] ?? row.zone}
                </span>
              </div>
              <div
                className={dropTarget === row.tableId ? `${styles.track} ${styles.trackDrop}` : styles.track}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropTarget(row.tableId)
                }}
                onDragLeave={() => setDropTarget((cur) => (cur === row.tableId ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault()
                  setDropTarget(null)
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) void reassign(id, [row.tableId])
                }}
              >
                {grid.hourTicks.slice(1).map((t) => (
                  <span
                    key={t}
                    className={styles.gridline}
                    style={{ left: `${((t - grid.startMin) / range) * 100}%` }}
                  />
                ))}
                {row.reservations.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={styles.block}
                    data-status={r.status}
                    style={blockStyle(r)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', r.id)}
                    onClick={() => setSelectedId(r.id)}
                    title={`${r.name} · ${r.partySize}P · ${STATUS_LABELS[r.status] ?? r.status}`}
                  >
                    <span className={styles.blockTime}>{r.time}</span>
                    <span className={styles.blockName}>{r.name}</span>
                    <span className={styles.blockParty}>
                      {r.partySize}P{r.tableIds.length > 1 ? ` · ${r.tableIds.length} Tische` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {grid.rows.length === 0 ? (
            <p className={styles.noTables}>Noch keine Tische angelegt — unter „Tische" konfigurieren.</p>
          ) : null}
        </div>
      </div>

      {selected ? (
        <ReservationPanel
          reservation={selected}
          tables={tables}
          labelById={labelById}
          busy={busy}
          onClose={() => setSelectedId(null)}
          onStatus={(s) => changeStatus(selected.id, s)}
          onReassign={(ids) => reassign(selected.id, ids)}
        />
      ) : null}

      {walkInOpen ? (
        <WalkInDialog
          date={date}
          busy={busy}
          onClose={() => setWalkInOpen(false)}
          onSubmit={async (payload) => {
            const ok = await mutate('/api/manage/reservations', payload)
            if (ok) setWalkInOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

// --- Reservation detail panel --------------------------------------------

function ReservationPanel({
  reservation,
  tables,
  labelById,
  busy,
  onClose,
  onStatus,
  onReassign,
}: {
  reservation: DayGridReservation
  tables: TableLite[]
  labelById: Map<string, string>
  busy: boolean
  onClose: () => void
  onStatus: (status: string) => void
  onReassign: (tableIds: string[]) => void
}) {
  const [picked, setPicked] = useState<string[]>(reservation.tableIds)

  const toggle = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} aria-label="Reservierungsdetails">
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{reservation.name}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>

        <dl className={styles.detailList}>
          <div>
            <dt>Uhrzeit</dt>
            <dd>{reservation.time}</dd>
          </div>
          <div>
            <dt>Personen</dt>
            <dd>{reservation.partySize}</dd>
          </div>
          <div>
            <dt>Quelle</dt>
            <dd>{SOURCE_LABELS[reservation.source ?? 'web'] ?? reservation.source}</dd>
          </div>
          {reservation.phone ? (
            <div>
              <dt>Telefon</dt>
              <dd>{reservation.phone}</dd>
            </div>
          ) : null}
          {reservation.email ? (
            <div>
              <dt>E-Mail</dt>
              <dd>{reservation.email}</dd>
            </div>
          ) : null}
          {reservation.notes ? (
            <div>
              <dt>Notiz</dt>
              <dd>{reservation.notes}</dd>
            </div>
          ) : null}
          <div>
            <dt>Tische</dt>
            <dd>
              {reservation.tableIds.length > 0
                ? reservation.tableIds.map((id) => labelById.get(id) ?? id).join(' + ')
                : 'Nicht zugeteilt'}
            </dd>
          </div>
        </dl>

        <div className={styles.panelSection}>
          <h3 className={styles.panelSubtitle}>Status</h3>
          <div className={styles.statusRow}>
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                type="button"
                className={s === reservation.status ? `${styles.statusBtn} ${styles.statusBtnActive}` : styles.statusBtn}
                data-status={s}
                disabled={busy}
                onClick={() => onStatus(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.panelSection}>
          <h3 className={styles.panelSubtitle}>Tische zuteilen</h3>
          <div className={styles.tablePick}>
            {tables.map((t) => (
              <label key={t.id} className={styles.tablePickItem}>
                <input
                  type="checkbox"
                  checked={picked.includes(t.id)}
                  onChange={() => toggle(t.id)}
                />
                <span>
                  {t.label} <span className={styles.tablePickMeta}>{t.capacity}P</span>
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            className={styles.saveBtn}
            disabled={busy}
            onClick={() => onReassign(picked)}
          >
            Tische speichern
          </button>
        </div>
      </aside>
    </>
  )
}

// --- Walk-in / phone booking dialog --------------------------------------

function WalkInDialog({
  date,
  busy,
  onClose,
  onSubmit,
}: {
  date: string
  busy: boolean
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>) => void
}) {
  const [time, setTime] = useState('19:00')
  const [partySize, setPartySize] = useState(2)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [source, setSource] = useState<'phone' | 'walkin'>('phone')

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div className={styles.dialog} role="dialog" aria-label="Neue Reservierung">
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Neue Reservierung</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit({ date, time, partySize, name, phone, notes, source })
          }}
        >
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Uhrzeit</span>
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={styles.input} />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Personen</span>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className={styles.input}
              />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Name</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Telefon (optional)</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Notiz (optional)</span>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={styles.input} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Quelle</span>
            <select value={source} onChange={(e) => setSource(e.target.value as 'phone' | 'walkin')} className={styles.input}>
              <option value="phone">Telefon</option>
              <option value="walkin">Walk-in</option>
            </select>
          </label>
          <button type="submit" className={styles.saveBtn} disabled={busy}>
            {busy ? 'Speichern …' : 'Reservierung anlegen'}
          </button>
        </form>
      </div>
    </>
  )
}
