import { getPayload } from 'payload'
import config from '@payload-config'

import { SiteChrome } from './_chrome/SiteChrome'
import { EditorialHero } from '../../components/EditorialHero/EditorialHero'
import { Marquee } from '../../components/Marquee/Marquee'
import { SignatureFeatured } from '../../components/SignatureFeatured/SignatureFeatured'
import { AlternatingFeature } from '../../components/AlternatingFeature/AlternatingFeature'
import { PullQuote } from '../../components/PullQuote/PullQuote'
import { AtmosphereMosaic } from '../../components/AtmosphereMosaic/AtmosphereMosaic'
import { FaqEditorial } from '../../components/FaqEditorial/FaqEditorial'
import { MapEmbed } from '../../components/MapEmbed/MapEmbed'
import { CtaBand } from '../../components/CtaBand/CtaBand'
import { ScrollReveal } from '../../components/ScrollReveal/ScrollReveal'
import { FloatingReserveCta } from '../../components/FloatingReserveCta/FloatingReserveCta'
import styles from './home.module.css'

const WEEKDAY_LABEL: Record<string, string> = {
  '1': 'Mo', '2': 'Di', '3': 'Mi', '4': 'Do', '5': 'Fr', '6': 'Sa', '0': 'So',
}
const WEEKDAY_ORDER = ['1', '2', '3', '4', '5', '6', '0']

// ── Fallback content (used when no CMS home doc exists yet) ────────────────

const DEFAULT_ATMOSPHERE = [
  { url: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=2000&q=80', alt: 'Tavolata mit Antipasti' },
  { url: 'https://images.unsplash.com/photo-1601925268712-2bf9c4be1f9c?auto=format&fit=crop&w=1400&q=80', alt: 'Glas Rotwein' },
  { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=80', alt: 'Holzofen Pizza' },
  { url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=2000&q=80', alt: 'Olivenzweig auf Tisch' },
]

const DEFAULT_FAQ = [
  { q: 'Sind Hunde im Restaurant erlaubt?', a: 'Gut erzogene Hunde sind bei uns herzlich willkommen — Wasserschüssel stellen wir auf Anfrage gern bereit. Bitte gib uns kurz Bescheid, damit wir dir einen passenden Tisch reservieren.' },
  { q: 'Ist das Restaurant barrierefrei?', a: 'Der Gastraum ist ebenerdig zugänglich, eine barrierefreie Toilette ist vorhanden. Wenn du besondere Anforderungen hast, ruf uns gern vorab an — wir richten es ein.' },
  { q: 'Habt ihr vegane oder vegetarische Gerichte?', a: 'Ja — die Karte enthält zahlreiche vegetarische Klassiker, mehrere vegane Pasta- und Antipasti-Optionen, und auf Wunsch passen wir Gerichte für dich an.' },
  { q: 'Gibt es Parkplätze in der Nähe?', a: 'In den umliegenden Straßen findest du gebührenpflichtige Parkplätze. Das nächste Parkhaus ist 4 Gehminuten entfernt. Mit ÖPNV erreichst du uns am bequemsten.' },
  { q: 'Kann ich auch ohne Reservierung kommen?', a: 'Walk-ins versuchen wir immer einzurichten — am Wochenende empfehlen wir aber eine Reservierung, um Wartezeiten zu vermeiden.' },
]

interface OpeningHoursDay {
  weekday: string
  isClosed?: boolean
  segments?: { open: string; close: string }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBlock(layout: any[], blockType: string): any | undefined {
  return layout.find((b) => b.blockType === blockType)
}

export default async function HomePage() {
  const payload = await getPayload({ config })
  const [homeResult, contact, hours] = await Promise.all([
    payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, depth: 2 }),
    payload.findGlobal({ slug: 'contact-info' }),
    payload.findGlobal({ slug: 'opening-hours' }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = contact as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = hours as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = (homeResult.docs[0] as any)?.layout ?? []

  // ── Extract blocks by type ─────────────────────────────────────────────
  const heroB      = findBlock(layout, 'editorial-hero')
  const marqueeB   = findBlock(layout, 'home-marquee')
  const introB     = findBlock(layout, 'home-intro')
  const signatureB = findBlock(layout, 'home-signature')
  const featuresB  = findBlock(layout, 'alternating-features')
  const pullB      = findBlock(layout, 'pull-quote')
  const atmosB     = findBlock(layout, 'atmosphere-mosaic')
  const faqB       = findBlock(layout, 'faq-editorial')
  const ctaBandB   = findBlock(layout, 'cta-band')

  interface FeatureItem {
    id?: string
    eyebrow?: string
    title?: string
    body?: string
    price?: string
    image?: { url?: string; alt?: string; sizes?: { card?: { url?: string } } } | null
  }
  const featureItems: FeatureItem[] = (featuresB?.items ?? []).filter(
    (it: FeatureItem) => it.image && (it.image.sizes?.card?.url || it.image.url),
  )

  // ── Derived values ─────────────────────────────────────────────────────
  const addressLine = `${c.street ?? ''}, ${c.zip ?? ''} ${c.city ?? ''}`.trim()
  const mapEmbed: string =
    c?.maps?.embedUrl?.trim() ||
    `https://www.google.com/maps?q=${encodeURIComponent(addressLine || c.restaurantName || 'Restaurant')}&output=embed`

  const todayIdx = String(new Date().getDay())
  const regular: OpeningHoursDay[] = h?.regular ?? []
  const byDay: Record<string, OpeningHoursDay | undefined> = {}
  regular.forEach((d) => (byDay[d.weekday] = d))

  const marqueeItems: string[] = marqueeB?.items?.map((i: { text: string }) => i.text) ??
    ['Parpali', 'Italiano', 'Stagionale', 'Artigianale', 'Toscana']

  const introParas: string[] = introB?.paragraphs?.map((p: { text: string }) => p.text) ?? [
    'Aus der Küche kommt, was die Saison gibt. Wir kochen klassisch italienisch, ohne Schnörkel, mit Zutaten von kleinen Höfen, hausgemachter Pasta und einer Weinkarte, die mit unseren Gerichten gewachsen ist.',
    'Komm vorbei — am besten zu zweit, gern auch zu sechst. Die Gespräche am Tisch gehören zur Karte dazu.',
  ]

  const atmosMapped: { url: string; alt: string }[] | undefined = atmosB?.tiles
    ?.map((t: { image?: { url?: string; alt?: string } }) => ({
      url: t.image?.url ?? '',
      alt: t.image?.alt ?? '',
    }))
    ?.filter((t: { url: string }) => !!t.url)
  const atmosTiles = (atmosMapped && atmosMapped.length > 0) ? atmosMapped : DEFAULT_ATMOSPHERE

  const faqItems: { q: string; a: string }[] =
    faqB?.items?.map((i: { q: string; a: string }) => ({ q: i.q, a: i.a })) ?? DEFAULT_FAQ

  const ctaBandSecondary = ctaBandB?.secondary?.label && ctaBandB?.secondary?.href
    ? { label: ctaBandB.secondary.label, href: ctaBandB.secondary.href }
    : c.phone
      ? { label: 'Anrufen', href: `tel:${String(c.phone).replace(/[^+\d]/g, '')}` }
      : undefined

  return (
    <SiteChrome activeHref="/">
      <main className={styles.main}>

        <EditorialHero
          eyebrow={heroB?.eyebrow ?? 'Toskana · Berlin'}
          brand={heroB?.brand ?? c.restaurantName ?? 'Parpali'}
          tagline={heroB?.tagline ?? 'Hausgemachte Pasta, Holzofen-Pizza, sorgfältig kuratierte Weinkarte — italienische Küche mit einem Hauch Mittelmeer.'}
          primaryCta={heroB?.primaryCta ?? { label: 'Tisch reservieren', href: '/reservierung' }}
          secondaryCta={
            heroB?.secondaryCta?.label && heroB?.secondaryCta?.href
              ? { label: heroB.secondaryCta.label, href: heroB.secondaryCta.href }
              : { label: 'Speisekarte', href: '/menu' }
          }
          imageUrl={
            (heroB?.image as { sizes?: { hero?: { url?: string } } } | null)?.sizes?.hero?.url ||
            (heroB?.image as { url?: string } | null)?.url ||
            undefined
          }
          imageAlt={(heroB?.image as { alt?: string } | null)?.alt || undefined}
        />

        <a id="below" aria-hidden="true" />

        <Marquee items={marqueeItems} variant={marqueeB?.variant ?? 'fraunces'} />

        <ScrollReveal as="section" className={styles.intro}>
          <div className={styles.introGrid}>
            <blockquote className={styles.introQuote}>
              &ldquo;{introB?.quote ?? 'Buona cucina, buon vino, buoni amici'}&rdquo;
            </blockquote>
            <div className={styles.introCopy}>
              {introParas.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </ScrollReveal>

        {featureItems.length > 0 ? (
          <section className={styles.featuresSection} aria-labelledby="features-title">
            <header className={styles.featuresHead}>
              {signatureB?.eyebrow ? <span className={styles.eyebrow}>{signatureB.eyebrow}</span> : null}
              {signatureB?.title ? <h2 id="features-title" className={styles.featuresTitle}>{signatureB.title}</h2> : null}
              {signatureB?.lead ? <p className={styles.featuresLead}>{signatureB.lead}</p> : null}
            </header>
            {featureItems.map((it, i) => (
              <AlternatingFeature
                key={it.id ?? i}
                imageSide={i % 2 === 0 ? 'left' : 'right'}
                imageUrl={it.image?.sizes?.card?.url ?? it.image?.url ?? ''}
                imageAlt={it.image?.alt ?? it.title ?? ''}
                eyebrow={it.eyebrow}
                title={String(it.title ?? '')}
                body={it.body}
                meta={it.price}
              />
            ))}
          </section>
        ) : (
          <SignatureFeatured
            eyebrow={signatureB?.eyebrow}
            title={signatureB?.title}
            lead={signatureB?.lead}
          />
        )}

        <PullQuote
          quote={pullB?.quote ?? 'Saisonal, regional, handgemacht — und für dich gekocht.'}
          variant={pullB?.variant ?? 'elev'}
        />

        <AtmosphereMosaic tiles={atmosTiles} />

        <ScrollReveal as="section" className={styles.hoursSection}>
          <div className={styles.hoursInner}>
            <span className={styles.eyebrow}>Öffnungszeiten</span>
            <h2 className={styles.hoursTitle}>Wann wir für dich kochen</h2>
            <ul className={styles.hoursList}>
              {WEEKDAY_ORDER.map((wd) => {
                const day = byDay[wd]
                const today = wd === todayIdx
                return (
                  <li key={wd} className={`${styles.hoursRow} ${today ? styles.today : ''}`}>
                    <span className={styles.hoursDay}>{WEEKDAY_LABEL[wd]}</span>
                    <span className={styles.hoursValue}>
                      {!day || day.isClosed
                        ? 'Ruhetag'
                        : (day.segments ?? []).map((s) => `${s.open}–${s.close}`).join('  ·  ') || 'geöffnet'}
                    </span>
                    {today ? <span className={styles.todayBadge}>heute</span> : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </ScrollReveal>

        <FaqEditorial items={faqItems} />

        <section className={styles.mapSection}>
          <div className={styles.mapFrame}>
            <MapEmbed embedUrl={mapEmbed} title={`Karte zu ${c.restaurantName}`} aspectRatio="21 / 9" />
            <div className={styles.mapCard}>
              <span className={styles.eyebrow}>So findest du uns</span>
              <p className={styles.mapAddress}>
                <strong>{c.restaurantName}</strong>
                <br />
                {c.street}
                <br />
                {c.zip} {c.city}
              </p>
            </div>
          </div>
        </section>

        <CtaBand
          eyebrow={ctaBandB?.eyebrow ?? 'Reservieren'}
          title={ctaBandB?.title ?? 'Heute Abend zu uns?'}
          body={ctaBandB?.body ?? 'Wir empfehlen frühzeitig zu reservieren — am Wochenende sind wir meist gut besucht.'}
          primary={ctaBandB?.primary ?? { label: 'Tisch reservieren', href: '/reservierung' }}
          secondary={ctaBandSecondary}
          variant="inverse"
        />

      </main>
      <FloatingReserveCta />
    </SiteChrome>
  )
}
