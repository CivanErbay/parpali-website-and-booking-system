'use client'

import { useEffect, useState } from 'react'
import styles from './BookingForm.module.css'
import { DatePicker } from './DatePicker'

interface SlotResponse {
  slots?: { time: string }[]
  policy?: { maxPartyOnline?: number }
  error?: string
}

interface BookingFormProps {
  /** Optional restaurant phone number to surface for groups too large for online booking. */
  phone?: string
  /** Maximum party allowed via online booking (matches BookingSettings global). */
  maxPartyOnline?: number
}

type Step = 'pick' | 'details' | 'confirmed'

const todayIso = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function BookingForm({ phone, maxPartyOnline = 8 }: BookingFormProps) {
  // useId reserved if/when we move to label[for]+id pattern

  const [step, setStep] = useState<Step>('pick')
  const [date, setDate] = useState<string>(todayIso())
  const [partySize, setPartySize] = useState<number>(2)
  const [time, setTime] = useState<string>('')
  const [slots, setSlots] = useState<{ time: string }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    setTime('')
    setSlots([])
    setSlotsError(null)
    if (!date || partySize < 1) return
    if (partySize > maxPartyOnline) return

    const ctrl = new AbortController()
    setLoadingSlots(true)
    fetch(`/api/availability?date=${date}&partySize=${partySize}`, { signal: ctrl.signal })
      .then(async (r) => (await r.json()) as SlotResponse)
      .then((data) => {
        if (data.error) {
          setSlotsError(data.error)
          setSlots([])
        } else {
          setSlots(data.slots ?? [])
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === 'AbortError') return
        setSlotsError('Verfügbarkeit konnte nicht geladen werden.')
      })
      .finally(() => setLoadingSlots(false))

    return () => ctrl.abort()
  }, [date, partySize, maxPartyOnline])

  const groupTooLarge = partySize > maxPartyOnline

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          partySize,
          name,
          email,
          phone: phoneInput,
          notes: notes || undefined,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setSubmitError(data.error ?? 'Reservierung konnte nicht gespeichert werden.')
        setSubmitting(false)
        return
      }
      setStep('confirmed')
    } catch {
      setSubmitError('Reservierung konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'confirmed') {
    return (
      <div className={styles.root} aria-live="polite">
        <h2 className={styles.title}>Reservierung bestätigt</h2>
        <p className={styles.body}>
          Vielen Dank, {name}. Wir haben deine Reservierung am <strong>{date}</strong> um{' '}
          <strong>{time}</strong> für <strong>{partySize}</strong> Personen aufgenommen. Eine
          Bestätigung ist an {email} unterwegs.
        </p>
        <p className={styles.bodyMuted}>
          Falls du dich verspätest oder absagen musst, ruf uns kurz an
          {phone ? <> · <a className={styles.linkInline} href={`tel:${phone}`}>{phone}</a></> : null}.
        </p>
      </div>
    )
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>1 · Datum &amp; Personen</legend>
        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>Datum</span>
            <DatePicker value={date} onChange={setDate} min={todayIso()} ariaLabel="Datum" />
          </div>
          <label className={styles.field}>
            <span className={styles.label}>Personen</span>
            <select
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className={styles.input}
            >
              {Array.from({ length: maxPartyOnline + 2 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Person' : 'Personen'}{n > maxPartyOnline ? ' — telefonisch anfragen' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {groupTooLarge ? (
        <p className={styles.notice}>
          Für Gruppen ab {maxPartyOnline + 1} Personen nehmen wir die Reservierung gerne telefonisch entgegen
          {phone ? <> · <a className={styles.linkInline} href={`tel:${phone}`}>{phone}</a></> : null}.
        </p>
      ) : (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>2 · Uhrzeit wählen</legend>
          {loadingSlots ? (
            <p className={styles.muted}>Verfügbare Zeiten werden geladen …</p>
          ) : slotsError ? (
            <p className={styles.error}>{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className={styles.muted}>Für diesen Tag und diese Gruppengröße sind aktuell keine Zeitslots verfügbar.</p>
          ) : (
            <ul className={styles.slotGrid} role="radiogroup" aria-label="Verfügbare Zeitslots">
              {slots.map((s) => (
                <li key={s.time}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={time === s.time}
                    className={time === s.time ? `${styles.slot} ${styles.slotActive}` : styles.slot}
                    onClick={() => setTime(s.time)}
                  >
                    {s.time}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}

      {time && !groupTooLarge ? (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>3 · Kontaktdaten</legend>
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>E-Mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Telefon</span>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className={styles.input}
              />
            </label>
          </div>
          <label className={styles.fieldFull}>
            <span className={styles.label}>Anmerkungen (optional)</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
              placeholder="Allergien, besonderer Anlass, Sitzplatzwunsch …"
            />
          </label>

          {submitError ? <p className={styles.error} role="alert">{submitError}</p> : null}

          <button type="submit" className={styles.cta} disabled={submitting}>
            {submitting ? 'Sende …' : 'Reservierung bestätigen'}
          </button>
        </fieldset>
      ) : null}
    </form>
  )
}
