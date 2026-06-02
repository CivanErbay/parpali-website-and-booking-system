'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './forms.module.css'

export interface ContactValues {
  restaurantName: string
  street: string
  zip: string
  city: string
  phone: string
  email: string
  whatsapp: string
  ownerName: string
  vatId: string
  maps: { directionsUrl: string; embedUrl: string }
  social: { platform: string; url: string }[]
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'google', label: 'Google' },
]

export function ContactInfoForm({ initial }: { initial: ContactValues }) {
  const router = useRouter()
  const [v, setV] = useState<ContactValues>(initial)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const set = (patch: Partial<ContactValues>) => setV((p) => ({ ...p, ...patch }))
  const setMaps = (patch: Partial<ContactValues['maps']>) => setV((p) => ({ ...p, maps: { ...p.maps, ...patch } }))
  const setSocial = (i: number, patch: Partial<{ platform: string; url: string }>) =>
    setV((p) => ({ ...p, social: p.social.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }))
  const addSocial = () => setV((p) => ({ ...p, social: [...p.social, { platform: 'instagram', url: '' }] }))
  const removeSocial = (i: number) => setV((p) => ({ ...p, social: p.social.filter((_, idx) => idx !== i) }))

  async function save() {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch('/api/manage/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...v, social: v.social.filter((s) => s.url) }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setStatus(res.ok ? { ok: true, msg: 'Gespeichert.' } : { ok: false, msg: data.error ?? 'Speichern fehlgeschlagen.' })
      if (res.ok) router.refresh()
    } catch {
      setStatus({ ok: false, msg: 'Netzwerkfehler.' })
    } finally {
      setBusy(false)
    }
  }

  const field = (label: string, value: string, onChange: (s: string) => void, opts: { type?: string; hint?: string } = {}) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input type={opts.type ?? 'text'} className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} />
      {opts.hint ? <span className={styles.hint}>{opts.hint}</span> : null}
    </label>
  )

  return (
    <div className={styles.form}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Kontakt</h2>
        <div className={styles.card}>
          <div className={styles.grid}>
            {field('Telefon', v.phone, (s) => set({ phone: s }), { type: 'tel' })}
            {field('E-Mail', v.email, (s) => set({ email: s }), {
              type: 'email',
              hint: 'Wird öffentlich angezeigt UND empfängt die Benachrichtigung bei neuen Reservierungen.',
            })}
            {field('WhatsApp', v.whatsapp, (s) => set({ whatsapp: s }), { hint: 'International ohne +, z.B. 4915123456789. Optional.' })}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Restaurant & Adresse</h2>
        <div className={styles.card}>
          <div className={styles.grid}>
            {field('Name des Restaurants', v.restaurantName, (s) => set({ restaurantName: s }))}
            {field('Straße & Nr.', v.street, (s) => set({ street: s }))}
            {field('PLZ', v.zip, (s) => set({ zip: s }))}
            {field('Ort', v.city, (s) => set({ city: s }))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Impressum</h2>
        <div className={styles.card}>
          <div className={styles.grid}>
            {field('Inhaber / Vertretungsberechtigte/r', v.ownerName, (s) => set({ ownerName: s }))}
            {field('USt-IdNr.', v.vatId, (s) => set({ vatId: s }), { hint: 'z.B. DE123456789. Optional.' })}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Google Maps</h2>
        <div className={styles.card}>
          <div className={styles.grid}>
            {field('Routen-Link', v.maps.directionsUrl, (s) => setMaps({ directionsUrl: s }), { hint: 'Maps-Link für „Route planen". Optional.' })}
            {field('Embed-URL', v.maps.embedUrl, (s) => setMaps({ embedUrl: s }), { hint: 'Maps-Embed-URL (iframe src). Optional.' })}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Social Links</h2>
        <div className={styles.list}>
          {v.social.length === 0 ? <p className={styles.empty}>Keine Social Links.</p> : null}
          {v.social.map((s, i) => (
            <div key={i} className={styles.listRow}>
              <div className={styles.rowField}>
                <span className={styles.label}>Plattform</span>
                <select className={styles.inlineInput} value={s.platform} onChange={(e) => setSocial(i, { platform: e.target.value })}>
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.rowField} ${styles.rowFieldGrow}`}>
                <span className={styles.label}>URL</span>
                <input type="url" className={styles.inlineInput} value={s.url} onChange={(e) => setSocial(i, { url: e.target.value })} />
              </div>
              <button type="button" className={styles.removeBtn} onClick={() => removeSocial(i)}>Entfernen</button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addSocial}>+ Social Link</button>
        </div>
      </section>

      <div className={styles.saveBar}>
        <button type="button" className={styles.saveBtn} disabled={busy} onClick={save}>
          {busy ? 'Speichern …' : 'Kontaktdaten speichern'}
        </button>
        {status ? (
          <span className={`${styles.status} ${status.ok ? styles.statusOk : styles.statusErr}`} role="status">{status.msg}</span>
        ) : null}
      </div>
    </div>
  )
}
