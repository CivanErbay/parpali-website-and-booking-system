'use client'

/**
 * Tablet-first run-sheet — the primary host-stand view (ADR-0015). A vertical,
 * touch-friendly list grouped by service state (Erwartet / Anwesend / Erledigt)
 * instead of the horizontally-scrolling timeline grid. Large tap targets, no
 * hover-only interactions; detail and quick-add open as bottom sheets.
 *
 * Self-contained: it owns its fetch/mutate against the existing
 * /api/manage/reservations* endpoints, so the grid view (DayBoard) is untouched.
 */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './RunSheet.module.css'
import {
  type DayGrid,
  type DayGridReservation,
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

interface RunSheetProps {
  grid: DayGrid
  date: string
  tables: TableLite[]
}

/** Service buckets, in the order a host reads them top-to-bottom. */
const GROUPS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'expected', label: 'Erwartet', statuses: ['pending', 'confirmed'] },
  { key: 'seated', label: 'Anwesend', statuses: ['seated'] },
  { key: 'done', label: 'Erledigt', statuses: ['completed', 'no-show'] },
]

/** Next half-hour as HH:mm, for the walk-in default when the date is today. */
function nextHalfHour(now: Date): string {
  const m = now.getMinutes()
  const add = m === 0 || m === 30 ? 0 : m < 30 ? 30 - m : 60 - m
  const d = new Date(now.getTime() + add * 60_000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function RunSheet({ grid, date, tables }: RunSheetProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const labelById = useMemo(() => new Map(tables.map((t) => [t.id, t.label])), [tables])
  const capacity = useMemo(() => tables.reduce((s, t) => s + t.capacity, 0), [tables])

  // Flatten to unique reservations (a combined booking sits in several rows).
  const all = useMemo(() => {
    const m = new Map<string, DayGridReservation>()
    for (const row of grid.rows) for (const r of row.reservations) m.set(r.id, r)
    for (const r of grid.unassigned) m.set(r.id, r)
    return [...m.values()]
  }, [grid])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.phone ?? '').toLowerCase().includes(q),
    )
  }, [all, query])

  const groups = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: filtered
          .filter((r) => g.statuses.includes(r.status))
          .sort((a, b) => a.startMin - b.startMin),
      })),
    [filtered],
  )

  const selected = selectedId ? all.find((r) => r.id === selectedId) ?? null : null

  async function mutate(url: string, body: unknown): Promise<boolean> {
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

  const changeStatus = (id: string, status: string) =>
    mutate(`/api/manage/reservations/${id}/status`, { status })
  const reassign = (id: string, tableIds: string[]) =>
    mutate(`/api/manage/reservations/${id}/reassign`, { tableIds })

  const fillPct = capacity > 0 ? Math.round((grid.totalGuests / capacity) * 100) : 0

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <div className={styles.fill} aria-label={`${grid.totalGuests} von ${capacity} Plätzen belegt`}>
          <span className={styles.fillCovers}>
            {grid.totalGuests}<span className={styles.fillSep}>/</span>{capacity}
          </span>
          <span className={styles.fillLabel}>Gäste · {fillPct}% voll</span>
          {grid.unassigned.length > 0 ? (
            <span className={styles.fillWarn}>{grid.unassigned.length} ohne Tisch</span>
          ) : null}
        </div>

        <label className={styles.search}>
          <span className={styles.srOnly}>Reservierung suchen</span>
          <input
            type="search"
            inputMode="search"
            placeholder="Name oder Telefon suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </label>

        <button type="button" className={styles.addBtn} onClick={() => setAddOpen(true)}>
          + Reservierung
        </button>
      </div>

      {!grid.open ? (
        <p className={styles.closedTag}>Ruhetag — Buchungen manuell weiterhin möglich.</p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : null}

      {all.length === 0 ? (
        <p className={styles.empty}>Noch keine Reservierungen für diesen Tag.</p>
      ) : (
        groups.map((g) => (
          <section key={g.key} className={styles.group}>
            <h2 className={styles.groupHead}>
              {g.label} <span className={styles.groupCount}>{g.items.length}</span>
            </h2>
            {g.items.length === 0 ? (
              <p className={styles.groupEmpty}>—</p>
            ) : (
              <ul className={styles.cards}>
                {g.items.map((r) => (
                  <ReservationCard
                    key={r.id}
                    r={r}
                    tableLabels={r.tableIds.map((id) => labelById.get(id) ?? id)}
                    busy={busy}
                    onOpen={() => setSelectedId(r.id)}
                    onStatus={(s) => changeStatus(r.id, s)}
                  />
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      {selected ? (
        <DetailSheet
          r={selected}
          tables={tables}
          labelById={labelById}
          busy={busy}
          onClose={() => setSelectedId(null)}
          onStatus={(s) => changeStatus(selected.id, s)}
          onReassign={(ids) => reassign(selected.id, ids)}
        />
      ) : null}

      {addOpen ? (
        <AddSheet
          date={date}
          tables={tables}
          busy={busy}
          onClose={() => setAddOpen(false)}
          onSubmit={async (payload) => {
            const ok = await mutate('/api/manage/reservations', payload)
            if (ok) setAddOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

// --- Reservation card -----------------------------------------------------

function ReservationCard({
  r,
  tableLabels,
  busy,
  onOpen,
  onStatus,
}: {
  r: DayGridReservation
  tableLabels: string[]
  busy: boolean
  onOpen: () => void
  onStatus: (status: string) => void
}) {
  // The one big forward action per state; everything else lives in the sheet.
  const primary =
    r.status === 'seated'
      ? { label: 'Abschließen', status: 'completed' }
      : r.status === 'completed' || r.status === 'no-show'
        ? null
        : { label: 'Eingetroffen', status: 'seated' }

  return (
    <li className={styles.card} data-status={r.status}>
      <button type="button" className={styles.cardMain} onClick={onOpen}>
        <span className={styles.cardTime}>{r.time}</span>
        <span className={styles.cardBody}>
          <span className={styles.cardName}>
            {r.name}
            <span className={styles.cardParty}> · {r.partySize}P</span>
          </span>
          <span className={styles.cardMeta}>
            <span className={styles.cardTables} data-unassigned={tableLabels.length === 0 ? 'true' : undefined}>
              {tableLabels.length > 0 ? tableLabels.join(' + ') : 'Ohne Tisch'}
            </span>
            <span className={styles.cardSource}>{SOURCE_LABELS[r.source ?? 'web'] ?? r.source}</span>
            <span className={styles.cardStatus}>{STATUS_LABELS[r.status] ?? r.status}</span>
          </span>
          {r.notes ? <span className={styles.cardNotes}>{r.notes}</span> : null}
        </span>
      </button>
      {primary ? (
        <button
          type="button"
          className={styles.cardAction}
          disabled={busy}
          onClick={() => onStatus(primary.status)}
        >
          {primary.label}
        </button>
      ) : null}
    </li>
  )
}

// --- Detail bottom sheet --------------------------------------------------

function DetailSheet({
  r,
  tables,
  labelById,
  busy,
  onClose,
  onStatus,
  onReassign,
}: {
  r: DayGridReservation
  tables: TableLite[]
  labelById: Map<string, string>
  busy: boolean
  onClose: () => void
  onStatus: (status: string) => void
  onReassign: (tableIds: string[]) => void
}) {
  const [picked, setPicked] = useState<string[]>(r.tableIds)
  const toggle = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <div className={styles.sheetWrap} role="dialog" aria-label="Reservierungsdetails">
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div className={styles.sheet}>
        <div className={styles.sheetGrip} aria-hidden="true" />
        <div className={styles.sheetHead}>
          <div>
            <h2 className={styles.sheetTitle}>{r.name}</h2>
            <p className={styles.sheetSub}>
              {r.time} · {r.partySize} Pers. · {SOURCE_LABELS[r.source ?? 'web'] ?? r.source}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>

        {(r.phone && r.phone !== '—') || r.notes ? (
          <div className={styles.sheetInfo}>
            {r.phone && r.phone !== '—' ? (
              <a className={styles.phoneLink} href={`tel:${r.phone}`}>📞 {r.phone}</a>
            ) : null}
            {r.notes ? <p className={styles.sheetNotes}>{r.notes}</p> : null}
          </div>
        ) : null}

        <div className={styles.sheetSection}>
          <h3 className={styles.sheetLabel}>Status</h3>
          <div className={styles.statusGrid}>
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                type="button"
                className={s === r.status ? `${styles.statusBtn} ${styles.statusBtnActive}` : styles.statusBtn}
                data-status={s}
                disabled={busy}
                onClick={() => onStatus(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sheetSection}>
          <h3 className={styles.sheetLabel}>
            Tische {picked.length > 0 ? `· ${picked.map((id) => labelById.get(id) ?? id).join(' + ')}` : ''}
          </h3>
          <div className={styles.tablePick}>
            {tables.map((t) => (
              <button
                key={t.id}
                type="button"
                className={picked.includes(t.id) ? `${styles.tableChip} ${styles.tableChipOn}` : styles.tableChip}
                onClick={() => toggle(t.id)}
                aria-pressed={picked.includes(t.id)}
              >
                {t.label}<span className={styles.tableChipCap}>{t.capacity}P</span>
              </button>
            ))}
          </div>
          <button type="button" className={styles.primaryBtn} disabled={busy} onClick={() => onReassign(picked)}>
            Tische speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Quick-add bottom sheet (phone / walk-in) -----------------------------

function AddSheet({
  date,
  tables,
  busy,
  onClose,
  onSubmit,
}: {
  date: string
  tables: TableLite[]
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
  const [tableIds, setTableIds] = useState<string[]>([])

  // Default to the next half-hour when adding for today (client-only — avoids
  // SSR hydration mismatch by setting after mount).
  useEffect(() => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (date === today) setTime(nextHalfHour(now))
  }, [date])

  const toggleTable = (id: string) =>
    setTableIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <div className={styles.sheetWrap} role="dialog" aria-label="Neue Reservierung">
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div className={styles.sheet}>
        <div className={styles.sheetGrip} aria-hidden="true" />
        <div className={styles.sheetHead}>
          <h2 className={styles.sheetTitle}>Neue Reservierung</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit({ date, time, partySize, name, phone, notes, source, tableIds })
          }}
        >
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Name</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
          </label>

          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Uhrzeit</span>
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={styles.input} />
            </label>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Personen</span>
              <div className={styles.stepper}>
                <button type="button" className={styles.stepBtn} onClick={() => setPartySize((p) => Math.max(1, p - 1))} aria-label="Weniger">−</button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={60}
                  value={partySize}
                  onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
                  className={styles.stepInput}
                />
                <button type="button" className={styles.stepBtn} onClick={() => setPartySize((p) => Math.min(60, p + 1))} aria-label="Mehr">+</button>
              </div>
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Telefon (optional)</span>
            <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Notiz (optional)</span>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={styles.input} />
          </label>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Quelle</span>
            <div className={styles.segmented}>
              <button type="button" className={source === 'phone' ? `${styles.segBtn} ${styles.segBtnOn}` : styles.segBtn} onClick={() => setSource('phone')}>Telefon</button>
              <button type="button" className={source === 'walkin' ? `${styles.segBtn} ${styles.segBtnOn}` : styles.segBtn} onClick={() => setSource('walkin')}>Walk-in</button>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Tisch (optional — leer = automatisch)</span>
            <div className={styles.tablePick}>
              {tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={tableIds.includes(t.id) ? `${styles.tableChip} ${styles.tableChipOn}` : styles.tableChip}
                  onClick={() => toggleTable(t.id)}
                  aria-pressed={tableIds.includes(t.id)}
                >
                  {t.label}<span className={styles.tableChipCap}>{t.capacity}P</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.primaryBtn} disabled={busy}>
            {busy ? 'Speichern …' : 'Reservierung anlegen'}
          </button>
        </form>
      </div>
    </div>
  )
}
