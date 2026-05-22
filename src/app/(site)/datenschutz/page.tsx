import { getPayload } from 'payload'
import config from '@payload-config'

import { SiteChrome } from '../_chrome/SiteChrome'
import styles from '../_legal/legal.module.css'

export const metadata = {
  title: 'Datenschutz · Parpali',
  description: 'Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.',
}

export default async function DatenschutzPage() {
  const payload = await getPayload({ config })
  const c = (await payload.findGlobal({ slug: 'contact-info' })) as {
    restaurantName?: string
    street?: string
    zip?: string
    city?: string
    phone?: string
    email?: string
  }

  return (
    <SiteChrome activeHref="/datenschutz">
      <main className={styles.page}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Rechtliches</span>
          <h1 className={styles.title}>Datenschutzerklärung</h1>
          <div className={styles.body}>
            <h2>1. Verantwortlicher</h2>
            <address>
              <strong>{c.restaurantName ?? 'Parpali'}</strong><br />
              {c.street ?? 'Beispielstraße 1'}, {c.zip ?? '10115'} {c.city ?? 'Berlin'}<br />
              E-Mail: <a href={`mailto:${c.email ?? ''}`}>{c.email ?? '—'}</a>
            </address>

            <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
            <p>
              Wir verarbeiten personenbezogene Daten unserer Gäste und
              Webseitennutzer ausschließlich, soweit dies zur Bereitstellung einer
              funktionsfähigen Webseite sowie unserer Inhalte und Leistungen
              (z. B. Reservierungen, Anfragen) erforderlich ist.
            </p>

            <h3>a) Reservierungen</h3>
            <p>
              Bei einer Online-Reservierung speichern wir Name, E-Mail, Telefon,
              Datum, Uhrzeit, Personenanzahl und ggf. deine Anmerkungen, um die
              Reservierung zu verwalten und dir eine Bestätigung zuzusenden.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>

            <h3>b) Kontaktanfragen</h3>
            <p>
              Wenn du uns über das Kontaktformular schreibst, speichern wir die
              angegebenen Daten zur Bearbeitung deiner Anfrage. Rechtsgrundlage:
              Art. 6 Abs. 1 lit. b und f DSGVO.
            </p>

            <h3>c) Server-Logfiles</h3>
            <p>
              Beim Aufruf unserer Webseite werden technische Informationen
              (IP-Adresse, Datum, abgerufene Seite) automatisch erfasst und nach
              kurzer Zeit gelöscht.
            </p>

            <h2>3. Externe Dienste</h2>
            <ul>
              <li>
                <strong>Google Maps</strong> — Wir binden eine Karte unseres
                Standorts ein. Beim Aufruf werden Daten an Google übertragen.
              </li>
              <li>
                <strong>Resend</strong> — Versand von Bestätigungsmails für
                Reservierungen und Anfragen.
              </li>
            </ul>

            <h2>4. Deine Rechte</h2>
            <p>
              Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
              Wende dich dafür an die oben genannten Kontaktdaten. Außerdem steht
              dir ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.
            </p>

            <h2>5. Speicherdauer</h2>
            <p>
              Reservierungs- und Anfragedaten werden gelöscht, sobald der Zweck
              der Verarbeitung entfällt und keine gesetzlichen
              Aufbewahrungspflichten entgegenstehen.
            </p>

            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--fg-3)' }}>
              Diese Datenschutzerklärung dient als Vorlage und sollte vor
              Veröffentlichung von einem/einer Anwält:in geprüft werden.
            </p>
          </div>
        </div>
      </main>
    </SiteChrome>
  )
}
