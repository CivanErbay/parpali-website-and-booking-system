import { getPayload } from 'payload'
import config from '@payload-config'

import { SiteChrome } from '../_chrome/SiteChrome'
import styles from '../_legal/legal.module.css'

export const metadata = {
  title: 'Impressum · Parpali',
  description: 'Anbieterkennzeichnung gemäß § 5 TMG.',
}

export default async function ImpressumPage() {
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
    <SiteChrome activeHref="/impressum">
      <main className={styles.page}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Rechtliches</span>
          <h1 className={styles.title}>Impressum</h1>
          <div className={styles.body}>
            <h2>Angaben gemäß § 5 TMG</h2>
            <address>
              <strong>{c.restaurantName ?? 'Parpali'}</strong><br />
              {c.street ?? 'Beispielstraße 1'}<br />
              {c.zip ?? '10115'} {c.city ?? 'Berlin'}<br />
              Deutschland
            </address>

            <h2>Kontakt</h2>
            <p>
              Telefon: <a href={`tel:${(c.phone ?? '').replace(/[^+\d]/g, '')}`}>{c.phone ?? '—'}</a><br />
              E-Mail: <a href={`mailto:${c.email ?? ''}`}>{c.email ?? '—'}</a>
            </p>

            <h2>Vertretungsberechtigte/r</h2>
            <p>
              [Name des Inhabers / der Geschäftsführerin]<br />
              Anschrift wie oben
            </p>

            <h2>Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
              [USt-IdNr. einsetzen]
            </p>

            <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
              [Name]<br />
              Anschrift wie oben
            </p>

            <h2>Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:
              {' '}<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.<br />
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungs­verfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>

            <h2>Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte
              auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
              §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
              überwachen.
            </p>

            <h2>Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
              Seiten unterliegen dem deutschen Urheberrecht.
            </p>
          </div>
        </div>
      </main>
    </SiteChrome>
  )
}
