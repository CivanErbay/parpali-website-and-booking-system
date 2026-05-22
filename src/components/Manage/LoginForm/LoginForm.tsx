'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './LoginForm.module.css'

/** Posts to Payload's built-in /api/users/login, which sets the session cookie. */
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError('E-Mail oder Passwort ist nicht korrekt.')
        setSubmitting(false)
        return
      }
      router.replace('/manage')
      router.refresh()
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte erneut versuchen.')
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.root}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <p className={styles.eyebrow}>Parpali</p>
        <h1 className={styles.title}>Reservierungs-Dashboard</h1>
        <p className={styles.intro}>Bitte melde dich an, um Reservierungen zu verwalten.</p>

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
          <span className={styles.label}>Passwort</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </label>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>
    </main>
  )
}
