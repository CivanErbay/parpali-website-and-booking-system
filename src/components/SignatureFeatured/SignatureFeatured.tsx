import { getPayload } from 'payload'
import config from '@payload-config'

import styles from './SignatureFeatured.module.css'
import { AlternatingFeature } from '../AlternatingFeature/AlternatingFeature'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1600&q=80',
]

const formatPrice = (eur: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(eur)

interface MenuItemDoc {
  id: string
  name: string
  description?: string | null
  price: number
  image?: { url?: string | null } | string | null
  category?: string | null
}

function imageUrl(item: MenuItemDoc, fallback: string): string {
  if (item.image && typeof item.image === 'object' && item.image.url) return item.image.url
  return fallback
}

const CATEGORY_LABEL: Record<string, string> = {
  antipasti: 'Antipasti',
  pasta: 'Pasta',
  pizze: 'Pizze',
  primi: 'Primi',
  secondi: 'Secondi',
  dolci: 'Dolci',
  salate: 'Salate',
  schnitzel: 'Schnitzel',
  burger: 'Burger',
  'fischgerichte': 'Fischgerichte',
  'grillgerichte': 'Grillgerichte',
  rumpsteak: 'Rumpsteak',
  ofenkartoffeln: 'Ofenkartoffeln',
  suppen: 'Suppen',
}

export interface SignatureFeaturedProps {
  eyebrow?: string
  title?: string
  lead?: string
}

export async function SignatureFeatured({
  eyebrow = 'Signature',
  title = 'Was wir besonders gern kochen',
  lead = 'Drei Gerichte, an denen wir hängen — saisonal, ehrlich, aus dem Holzofen, von Hand gerollt.',
}: SignatureFeaturedProps) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'menu-items',
    where: { isSignature: { equals: true } },
    limit: 3,
    sort: 'order',
  })

  const items = (docs as unknown as MenuItemDoc[]).slice(0, 3)
  if (items.length === 0) return null

  return (
    <section className={styles.wrap} aria-labelledby="signature-title">
      <header className={styles.head}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.title} id="signature-title">{title}</h2>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </header>

      {items.map((it, i) => (
        <AlternatingFeature
          key={it.id}
          imageSide={i % 2 === 0 ? 'left' : 'right'}
          imageUrl={imageUrl(it, FALLBACK_IMAGES[i % FALLBACK_IMAGES.length])}
          imageAlt={it.name}
          eyebrow={it.category ? CATEGORY_LABEL[it.category] ?? it.category : undefined}
          title={it.name}
          body={it.description ?? undefined}
          meta={formatPrice(it.price)}
          href="/menu"
        />
      ))}
    </section>
  )
}
