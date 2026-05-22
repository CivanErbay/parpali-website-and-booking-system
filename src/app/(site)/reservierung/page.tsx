import { getPayload } from 'payload'
import config from '@payload-config'

import { BookingForm } from '../../../components/BookingForm/BookingForm'
import { ScrollReveal } from '../../../components/ScrollReveal/ScrollReveal'
import { SiteChrome } from '../_chrome/SiteChrome'
import styles from './page.module.css'

export const metadata = {
  title: 'Reservierung · Parpali',
  description: 'Reserviere deinen Tisch im Parpali. Online-Buchung mit Live-Verfügbarkeit.',
}

const WEEKDAY_SHORT: Record<string, string> = {
  '1': 'Mo',
  '2': 'Di',
  '3': 'Mi',
  '4': 'Do',
  '5': 'Fr',
  '6': 'Sa',
  '0': 'So',
}
const WEEKDAY_ORDER = ['1', '2', '3', '4', '5', '6', '0']

interface OpeningRow {
  weekday: string
  segments?: { open: string; close: string }[]
  isClosed?: boolean
}

export default async function ReservierungPage() {
  const payload = await getPayload({ config })
  const [settings, contact, hours] = await Promise.all([
    payload.findGlobal({ slug: 'booking-settings' }),
    payload.findGlobal({ slug: 'contact-info' }),
    payload.findGlobal({ slug: 'opening-hours' }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maxPartyOnline = Number((settings as any)?.maxPartyOnline ?? 8)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = contact as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = hours as any
  const phone = String(c?.phone ?? '')
  const phoneTel = phone.replace(/[^+\d]/g, '')
  const whatsappNum = String(c?.whatsapp ?? '').replace(/[^\d]/g, '')

  const today = String(new Date().getDay())
  const regular: OpeningRow[] = h.regular ?? []
  const byDay = new Map(regular.map((r) => [r.weekday, r]))

  return (
    <SiteChrome activeHref="/reservierung">
      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Reservierung</span>
          <h1 className={styles.title}>
            <span className={styles.italic}>Tisch</span> reservieren
          </h1>
          <p className={styles.lead}>
            Wähle Datum, Personenzahl und einen freien Zeitslot. Du bekommst direkt im Anschluss eine
            Bestätigung per E-Mail.
          </p>
        </header>

        <div className={styles.layout}>
          <ScrollReveal className={styles.formCol}>
            <BookingForm phone={phone || undefined} maxPartyOnline={maxPartyOnline} />
          </ScrollReveal>

          <aside className={styles.aside}>
            <div className={styles.asideCard}>
              <span className={styles.asideLabel}>Lieber per Telefon?</span>
              <p className={styles.asideBody}>
                Für größere Gruppen, kurzfristige Reservierungen oder besondere Wünsche meld dich
                gern direkt bei uns.
              </p>
              <div className={styles.asideActions}>
                {phoneTel ? (
                  <a href={`tel:${phoneTel}`} className={styles.btnPrimary}>
                    {phone || 'Anrufen'}
                  </a>
                ) : null}
                {whatsappNum ? (
                  <a
                    href={`https://wa.me/${whatsappNum}`}
                    target="_blank"
                    rel="noopener"
                    className={styles.btnSecondary}
                  >
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>

            <div className={styles.asideCard}>
              <span className={styles.asideLabel}>Öffnungszeiten</span>
              <ul className={styles.hours}>
                {WEEKDAY_ORDER.map((wd) => {
                  const row = byDay.get(wd)
                  const isToday = wd === today
                  const isClosed = row?.isClosed || (row?.segments ?? []).length === 0
                  return (
                    <li key={wd} className={`${styles.hoursRow} ${isToday ? styles.today : ''}`}>
                      <span className={styles.hoursDay}>{WEEKDAY_SHORT[wd]}</span>
                      <span className={styles.hoursValue}>
                        {isClosed
                          ? 'Ruhetag'
                          : (row!.segments ?? []).map((s) => `${s.open}–${s.close}`).join('  ·  ')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </SiteChrome>
  )
}
