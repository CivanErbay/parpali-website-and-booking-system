'use client'

import React, { useState } from 'react'
import styles from './page.module.css'

const SUBJECTS = [
  { value: 'reservierung', label: 'Reservierung / Anfrage' },
  { value: 'event', label: 'Event / Private Dining' },
  { value: 'catering', label: 'Catering' },
  { value: 'feedback', label: 'Feedback / Lob / Kritik' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export function InquiryForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'reservierung',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const upd =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Fehler beim Senden.')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Fehler beim Senden.')
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.success}>
        <strong>Vielen Dank.</strong>
        <p style={{ margin: '0.5rem 0 0' }}>
          Wir haben deine Nachricht erhalten und melden uns innerhalb eines
          Werktags bei dir.
        </p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Name *</span>
        <input
          className={styles.input}
          type="text"
          value={form.name}
          onChange={upd('name')}
          required
          autoComplete="name"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>E-Mail *</span>
        <input
          className={styles.input}
          type="email"
          value={form.email}
          onChange={upd('email')}
          required
          autoComplete="email"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Telefon (optional)</span>
        <input
          className={styles.input}
          type="tel"
          value={form.phone}
          onChange={upd('phone')}
          autoComplete="tel"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Anliegen</span>
        <select className={styles.select} value={form.subject} onChange={upd('subject')}>
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className={`${styles.field} ${styles.full}`}>
        <span className={styles.fieldLabel}>Nachricht *</span>
        <textarea
          className={styles.textarea}
          value={form.message}
          onChange={upd('message')}
          required
          rows={6}
          placeholder="Schreib uns kurz, worum es geht — z. B. Datum, Personenanzahl, besondere Wünsche."
        />
      </label>
      {status === 'error' && <div className={`${styles.error} ${styles.full}`}>{errorMsg}</div>}
      <p className={`${styles.privacy} ${styles.full}`}>
        Mit dem Absenden stimmst du der Verarbeitung deiner Daten gemäß unserer
        {' '}<a href="/datenschutz" style={{ color: 'var(--accent)' }}>Datenschutzerklärung</a> zu.
      </p>
      <div className={styles.full}>
        <button type="submit" className={styles.submit} disabled={status === 'sending'}>
          {status === 'sending' ? 'Wird gesendet …' : 'Nachricht senden'}
          <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  )
}
