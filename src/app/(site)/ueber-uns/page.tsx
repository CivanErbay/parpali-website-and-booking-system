import { getPayload } from 'payload'
import config from '@payload-config'

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

const DEFAULT_PILLARS = [
  {
    title: 'Saisonal',
    body: 'Unsere Karte folgt den Jahreszeiten. Im Frühjahr Spargel, im Herbst Steinpilze — was reif ist, kommt auf den Teller.',
    img: u('photo-1542838132-92c53300491e'),
    eyebrow: 'Philosophie · 01',
  },
  {
    title: 'Regional',
    body: 'Wir arbeiten mit Lieferanten aus Brandenburg und Italien, die wir persönlich kennen. Kurze Wege, klarer Geschmack.',
    img: u('photo-1518791841217-8f162f1e1131'),
    eyebrow: 'Philosophie · 02',
  },
  {
    title: 'Handgemacht',
    body: 'Pasta, Soßen, Dressings, Dolci — alles entsteht in unserer Küche. Kein Fertigprodukt, kein Kompromiss.',
    img: u('photo-1473093226795-af9932fe5856'),
    eyebrow: 'Philosophie · 03',
  },
]

const DEFAULT_TEAM = [
  { name: 'Marco', role: 'Küchenchef', img: u('photo-1577219491135-ce391730fb2c', 800) },
  { name: 'Giulia', role: 'Service & Wein', img: u('photo-1438761681033-6461ffad8d80', 800) },
]

const DEFAULT_STORY = [
  'Parpali entstand aus einer einfachen Idee — italienische Küche, wie sie zu Hause gekocht wird: ohne Schnörkel, ohne Effekthascherei, mit großer Liebe zu Produkt und Handwerk. Hausgemachte Pasta, ein Holzofen, ein paar Flaschen Wein, die der Chef selbst ausgesucht hat.',
  'Wir glauben an saisonale Karten, an ehrliche Preise und daran, dass ein gutes Glas Wein zu jedem Abend gehört. Bei uns kommen viele Speisen direkt aus dem Holzofen — der gibt jeder Pizza ihren typischen, leicht rauchigen Boden.',
  'Wir kochen nicht, um etwas zu beweisen — sondern weil wir Lust haben, dass du zufrieden nach Hause gehst und morgen wiederkommst.',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBlock(layout: any[], blockType: string): any | undefined {
  return layout.find((b) => b.blockType === blockType)
}

export default async function UeberUnsPage() {
  const payload = await getPayload({ config })
  const pageResult = await payload.find({ collection: 'pages', where: { slug: { equals: 'ueber-uns' } }, limit: 1, depth: 2 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = (pageResult.docs[0] as any)?.layout ?? []

  const heroB      = findBlock(layout, 'page-hero')
  const storyB     = findBlock(layout, 'story-text')
  const pullB      = findBlock(layout, 'pull-quote')
  const signatureB = findBlock(layout, 'home-signature')
  const featuresB  = findBlock(layout, 'alternating-features')
  const teamB      = findBlock(layout, 'team-section')
  const ctaB       = findBlock(layout, 'cta-band')

  const storyParas: string[] = storyB?.paragraphs?.map((p: { text: string }) => p.text) ?? DEFAULT_STORY

  // Items: prefer `home-signature` block (new canonical), fall back to legacy
  // `alternating-features`, and finally to defaults. Items without an image are skipped.
  type ItemInput = { eyebrow?: string; title: string; body?: string; image?: { url?: string } }
  const customItems = (signatureB?.items ?? featuresB?.items ?? []) as ItemInput[]
  const filteredCustom = customItems.filter((it) => !!it.image?.url)
  const pillars: { eyebrow?: string; title: string; body?: string; img: string }[] =
    filteredCustom.length > 0
      ? filteredCustom.map((it) => ({
          eyebrow: it.eyebrow,
          title: it.title,
          body: it.body,
          img: it.image?.url as string,
        }))
      : DEFAULT_PILLARS

  const teamMembers: { name: string; role?: string; img: string }[] =
    teamB?.members?.map((m: { name: string; role?: string; image?: { url?: string } }) => ({
      name: m.name,
      role: m.role,
      img: m.image?.url ?? u('photo-1577219491135-ce391730fb2c', 800),
    })) ?? DEFAULT_TEAM

  const teamEyebrow: string = teamB?.eyebrow ?? 'Das Team'
  const teamHeading: string = teamB?.heading ?? 'Hinter den Tellern'

  return (
    <SiteChrome activeHref="/ueber-uns">
      <main className={styles.page}>
        <header className={styles.hero}>
          <ParallaxImage
            src={
              (heroB?.image as { sizes?: { hero?: { url?: string } } } | null)?.sizes?.hero?.url ??
              (heroB?.image as { url?: string } | null)?.url ??
              u('photo-1577219491135-ce391730fb2c', 2400)
            }
            alt={(heroB?.image as { alt?: string } | null)?.alt ?? 'Küche bei der Arbeit'}
            className={styles.heroImage}
            eager
          />
          <div className={styles.heroScrim} aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>{heroB?.eyebrow ?? 'Unsere Geschichte'}</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.italicWord}>{heroB?.titleItalic ?? 'Italienisch'}</span>,<br />
              {heroB?.title ?? 'mit Liebe zum Handwerk.'}
            </h1>
          </div>
        </header>

        <ScrollReveal as="article" className={styles.story}>
          {storyParas.map((text, i) => (
            <p key={i} className={i === 0 ? styles.lead : undefined}>{text}</p>
          ))}
        </ScrollReveal>

        <PullQuote
          quote={pullB?.quote ?? 'Eine Mahlzeit ist nie nur eine Mahlzeit — es ist ein Stück Zeit, geteilt.'}
          variant={pullB?.variant ?? 'elev'}
        />

        {(signatureB?.eyebrow || signatureB?.title || signatureB?.lead) ? (
          <ScrollReveal as="header" className={styles.signatureHead}>
            {signatureB?.eyebrow ? <span className={styles.eyebrow}>{signatureB.eyebrow}</span> : null}
            {signatureB?.title ? <h2 className={styles.h2}>{signatureB.title}</h2> : null}
            {signatureB?.lead ? <p>{signatureB.lead}</p> : null}
          </ScrollReveal>
        ) : null}

        {pillars.map((p, i) => (
          <AlternatingFeature
            key={p.title}
            imageSide={i % 2 === 0 ? 'left' : 'right'}
            imageUrl={p.img}
            imageAlt={p.title}
            eyebrow={p.eyebrow}
            title={p.title}
            body={p.body}
          />
        ))}

        <ScrollReveal as="section" className={styles.team} stagger>
          <header className={styles.teamHead}>
            <span className={styles.eyebrow}>{teamEyebrow}</span>
            <h2 className={styles.h2}>{teamHeading}</h2>
          </header>
          <div className={styles.teamGrid}>
            {teamMembers.map((m) => (
              <article key={m.name} className={styles.member} data-reveal>
                <div className={styles.portrait}>
                  <img src={m.img} alt={m.name} loading="lazy" />
                </div>
                <h3 className={styles.memberName}>{m.name}</h3>
                {m.role ? <span className={styles.memberRole}>{m.role}</span> : null}
              </article>
            ))}
          </div>
        </ScrollReveal>

        <CtaBand
          eyebrow={ctaB?.eyebrow ?? 'Komm vorbei'}
          title={ctaB?.title ?? 'Wir freuen uns auf dich.'}
          body={ctaB?.body ?? 'Manches lässt sich am Tisch besser erzählen als auf einer Webseite.'}
          primary={ctaB?.primary ?? { label: 'Tisch reservieren', href: '/reservierung' }}
          secondary={ctaB?.secondary ?? { label: 'Speisekarte ansehen', href: '/menu' }}
          variant="elev"
        />
      </main>
      <FloatingReserveCta />
    </SiteChrome>
  )
}
