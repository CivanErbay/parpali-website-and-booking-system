import { getPayload } from 'payload'
import config from '@payload-config'

import { SiteChrome } from '../_chrome/SiteChrome'
import { MapEmbed } from '../../../components/MapEmbed/MapEmbed'
import { ScrollReveal } from '../../../components/ScrollReveal/ScrollReveal'
import { PullQuote } from '../../../components/PullQuote/PullQuote'
import { FloatingReserveCta } from '../../../components/FloatingReserveCta/FloatingReserveCta'
import { InquiryForm } from './InquiryForm'
import styles from './page.module.css'

export const metadata = {
  title: 'Kontakt · Parpali',
  description:
    'Adresse, Öffnungszeiten und Kontakt zu Parpali — italienische und internationale Küche.',
}

const WEEKDAY_LABELS: Record<string, string> = {
  '1': 'Montag',
  '2': 'Dienstag',
  '3': 'Mittwoch',
  '4': 'Donnerstag',
  '5': 'Freitag',
  '6': 'Samstag',
  '0': 'Sonntag',
}
const WEEKDAY_ORDER = ['1', '2', '3', '4', '5', '6', '0']

interface OpeningRow {
  weekday: string
  segments?: { open: string; close: string }[]
  isClosed?: boolean
}

export default async function KontaktPage() {
  const payload = await getPayload({ config })
  const [contact, hours, pageResult] = await Promise.all([
    payload.findGlobal({ slug: 'contact-info' }),
    payload.findGlobal({ slug: 'opening-hours' }),
    payload.find({ collection: 'pages', where: { slug: { equals: 'kontakt' } }, limit: 1, depth: 1 }),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heroB = (pageResult.docs[0] as any)?.layout?.find((b: any) => b.blockType === 'page-hero')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = contact as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = hours as any

  const today = String(new Date().getDay())
  const regular: OpeningRow[] = h.regular ?? []
  const byDay = new Map(regular.map((r) => [r.weekday, r]))

  const addressLine = `${c.street ?? ''}, ${c.zip ?? ''} ${c.city ?? ''}`.trim()
  const phoneTel = String(c.phone ?? '').replace(/[^+\d]/g, '')
  const whatsappNum = String(c.whatsapp ?? '').replace(/[^\d]/g, '')
  const mapsDirections =
    c.maps?.directionsUrl ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLine)}`
  const mapsEmbed =
    c.maps?.embedUrl ||
    `https://www.google.com/maps?q=${encodeURIComponent(addressLine || c.restaurantName || 'Restaurant')}&output=embed`

  return (
    <SiteChrome activeHref="/kontakt">
      <main className={styles.page}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>{heroB?.eyebrow ?? 'Kontakt'}</span>
          <h1 className={styles.heroTitle}>
            <span className={styles.italic}>{heroB?.titleItalic ?? 'Sag'}</span> {heroB?.title ?? 'hallo.'}
          </h1>
        </header>

        <section className={styles.mapSection}>
          <MapEmbed embedUrl={mapsEmbed} title={`Karte zu ${c.restaurantName}`} aspectRatio="21 / 9" />
        </section>

        <ScrollReveal as="section" className={styles.grid}>
          <div className={styles.info}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Adresse</span>
              <address className={styles.address}>
                <strong>{c.restaurantName}</strong>
                <br />
                {c.street}
                <br />
                {c.zip} {c.city}
              </address>
              <div className={styles.actions}>
                {phoneTel ? (
                  <a href={`tel:${phoneTel}`} className={styles.btnPrimary}>
                    Anrufen
                  </a>
                ) : null}
                {whatsappNum ? (
                  <a
                    href={`https://wa.me/${whatsappNum}`}
                    className={styles.btnSecondary}
                    target="_blank"
                    rel="noopener"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <a
                  href={mapsDirections}
                  className={styles.btnSecondary}
                  target="_blank"
                  rel="noopener"
                >
                  Route planen
                </a>
              </div>
              <dl className={styles.contactList}>
                <div>
                  <dt>Telefon</dt>
                  <dd>{phoneTel ? <a href={`tel:${phoneTel}`}>{c.phone}</a> : '—'}</dd>
                </div>
                <div>
                  <dt>E-Mail</dt>
                  <dd>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : '—'}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.card}>
              <span className={styles.cardLabel}>Öffnungszeiten</span>
              <ul className={styles.hours}>
                {WEEKDAY_ORDER.map((wd) => {
                  const row = byDay.get(wd)
                  const isToday = wd === today
                  const isClosed = row?.isClosed || (row?.segments ?? []).length === 0
                  return (
                    <li key={wd} className={`${styles.hoursRow} ${isToday ? styles.todayRow : ''}`}>
                      <span className={styles.hoursDay}>
                        {WEEKDAY_LABELS[wd]}
                        {isToday ? <span className={styles.todayBadge}>heute</span> : null}
                      </span>
                      <span className={styles.hoursTimes}>
                        {isClosed
                          ? <span className={styles.hoursClosed}>Ruhetag</span>
                          : (row!.segments ?? []).map((s) => `${s.open} – ${s.close}`).join('  ·  ')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <div className={styles.formWrap}>
            <header className={styles.formHead}>
              <span className={styles.cardLabel}>Schreib uns</span>
              <h2 className={styles.formTitle}>Nachricht senden</h2>
              <p className={styles.formSub}>
                Für Anfragen ab 8 Personen, Events, Catering oder andere Themen — wir antworten
                innerhalb eines Werktags.
              </p>
            </header>
            <InquiryForm />
          </div>
        </ScrollReveal>

        <PullQuote
          quote="Schreib uns. Wir freuen uns."
          variant="elev"
        />
      </main>
      <FloatingReserveCta />
    </SiteChrome>
  )
}
