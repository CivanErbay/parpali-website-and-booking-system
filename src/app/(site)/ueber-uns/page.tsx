import { SiteChrome } from '../_chrome/SiteChrome'
import { CtaBand } from '../../../components/CtaBand/CtaBand'
import { ScrollReveal } from '../../../components/ScrollReveal/ScrollReveal'
import { PullQuote } from '../../../components/PullQuote/PullQuote'
import { AlternatingFeature } from '../../../components/AlternatingFeature/AlternatingFeature'
import { FloatingReserveCta } from '../../../components/FloatingReserveCta/FloatingReserveCta'
import { ParallaxImage } from '../../../components/ParallaxImage/ParallaxImage'
import styles from './page.module.css'

export const metadata = {
  title: 'Über uns · Parpali',
  description:
    'Die Geschichte hinter Parpali — italienische und internationale Küche. Saisonal, regional, handgemacht.',
}

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`

const TEAM = [
  { name: 'Marco', role: 'Küchenchef', img: 'photo-1577219491135-ce391730fb2c' },
  { name: 'Giulia', role: 'Service & Wein', img: 'photo-1438761681033-6461ffad8d80' },
  { name: 'Luca', role: 'Pasta & Pizza', img: 'photo-1507003211169-0a1dd7228f2d' },
]

const PILLARS = [
  {
    title: 'Saisonal',
    body: 'Unsere Karte folgt den Jahreszeiten. Im Frühjahr Spargel, im Herbst Steinpilze — was reif ist, kommt auf den Teller.',
    img: 'photo-1542838132-92c53300491e',
    eyebrow: 'Philosophie · 01',
  },
  {
    title: 'Regional',
    body: 'Wir arbeiten mit Lieferanten aus Brandenburg und Italien, die wir persönlich kennen. Kurze Wege, klarer Geschmack.',
    img: 'photo-1518791841217-8f162f1e1131',
    eyebrow: 'Philosophie · 02',
  },
  {
    title: 'Handgemacht',
    body: 'Pasta, Soßen, Dressings, Dolci — alles entsteht in unserer Küche. Kein Fertigprodukt, kein Kompromiss.',
    img: 'photo-1473093226795-af9932fe5856',
    eyebrow: 'Philosophie · 03',
  },
]

export default function UeberUnsPage() {
  return (
    <SiteChrome activeHref="/ueber-uns">
      <main className={styles.page}>
        <header className={styles.hero}>
          <ParallaxImage
            src={u('photo-1577219491135-ce391730fb2c', 2400)}
            alt="Küche bei der Arbeit"
            className={styles.heroImage}
            eager
          />
          <div className={styles.heroScrim} aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Unsere Geschichte</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.italicWord}>Italienisch</span>,<br />
              mit Berliner Wärme.
            </h1>
          </div>
        </header>

        <ScrollReveal as="article" className={styles.story}>
          <p className={styles.lead}>
            Parpali entstand aus einer einfachen Idee — italienische Küche, wie sie zu Hause gekocht
            wird: ohne Schnörkel, ohne Effekthascherei, mit großer Liebe zu Produkt und Handwerk.
            Hausgemachte Pasta, ein Holzofen, ein paar Flaschen Wein, die der Chef selbst ausgesucht
            hat.
          </p>
          <p>
            Wir glauben an saisonale Karten, an ehrliche Preise und daran, dass ein gutes Glas Wein
            zu jedem Abend gehört. Bei uns kommen viele Speisen direkt aus dem Holzofen — der gibt
            jeder Pizza ihren typischen, leicht rauchigen Boden.
          </p>
          <p>
            Wir kochen nicht, um etwas zu beweisen — sondern weil wir Lust haben, dass du zufrieden
            nach Hause gehst und morgen wiederkommst.
          </p>
        </ScrollReveal>

        <PullQuote
          quote="Eine Mahlzeit ist nie nur eine Mahlzeit — es ist ein Stück Zeit, geteilt."
          variant="elev"
        />

        {PILLARS.map((p, i) => (
          <AlternatingFeature
            key={p.title}
            imageSide={i % 2 === 0 ? 'left' : 'right'}
            imageUrl={u(p.img)}
            imageAlt={p.title}
            eyebrow={p.eyebrow}
            title={p.title}
            body={p.body}
          />
        ))}

        <ScrollReveal as="section" className={styles.team} stagger>
          <header className={styles.teamHead}>
            <span className={styles.eyebrow}>Das Team</span>
            <h2 className={styles.h2}>Hinter den Tellern</h2>
          </header>
          <div className={styles.teamGrid}>
            {TEAM.map((m) => (
              <article key={m.name} className={styles.member} data-reveal>
                <div className={styles.portrait}>
                  <img src={u(m.img, 800)} alt={m.name} loading="lazy" />
                </div>
                <h3 className={styles.memberName}>{m.name}</h3>
                <span className={styles.memberRole}>{m.role}</span>
              </article>
            ))}
          </div>
        </ScrollReveal>

        <CtaBand
          eyebrow="Komm vorbei"
          title="Wir freuen uns auf dich."
          body="Manches lässt sich am Tisch besser erzählen als auf einer Webseite."
          primary={{ label: 'Tisch reservieren', href: '/reservierung' }}
          secondary={{ label: 'Speisekarte ansehen', href: '/menu' }}
          variant="elev"
        />
      </main>
      <FloatingReserveCta />
    </SiteChrome>
  )
}
