import { getPayload } from 'payload'
import config from '@payload-config'

import { MENU_CATEGORIES } from '../../../collections/MenuItems'
import { MenuList, type MenuListSection } from '../../../components/MenuList/MenuList'
import { CtaBand } from '../../../components/CtaBand/CtaBand'
import { ScrollReveal } from '../../../components/ScrollReveal/ScrollReveal'
import { FloatingReserveCta } from '../../../components/FloatingReserveCta/FloatingReserveCta'
import { SiteChrome } from '../_chrome/SiteChrome'
import styles from './page.module.css'

export const metadata = {
  title: 'Speisekarte · Parpali',
  description: 'Antipasti, Pasta, Pizze, Dolci und unsere Weinkarte. Saisonal kuratiert.',
}

interface MenuItemDoc {
  id: string | number
  name?: string
  description?: string | null
  price?: number
  category?: string
  order?: number | null
  allergens?: string[] | null
  isVegetarian?: boolean | null
  isVegan?: boolean | null
  isSpicy?: boolean | null
}

export default async function MenuPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'menu-items',
    limit: 500,
    depth: 0,
    sort: 'order',
  })

  const items = docs as MenuItemDoc[]

  const sections: MenuListSection[] = MENU_CATEGORIES.map((cat) => ({
    category: cat.value,
    label: cat.label,
    items: items
      .filter((i) => i.category === cat.value)
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
      .map((i) => ({
        id: i.id,
        name: String(i.name ?? ''),
        description: i.description ?? undefined,
        price: Number(i.price ?? 0),
        allergens: i.allergens ?? undefined,
        isVegetarian: Boolean(i.isVegetarian),
        isVegan: Boolean(i.isVegan),
        isSpicy: Boolean(i.isSpicy),
      })),
  })).filter((s) => s.items.length > 0)

  return (
    <SiteChrome activeHref="/menu">
      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>La Carta</span>
          <h1 className={styles.title}>
            <span className={styles.titleItalic}>Speisekarte</span>
          </h1>
          <p className={styles.lead}>
            Saisonal, regional, handgemacht — italienische Küche mit internationalen Akzenten.
          </p>
        </header>

        {sections.length === 0 ? (
          <p className={styles.empty}>
            Die Speisekarte wird gerade gepflegt. Bitte schau bald wieder vorbei oder ruf uns an.
          </p>
        ) : (
          <>
            <nav className={styles.tabs} aria-label="Kategorien">
              <div className={styles.tabsInner}>
                {sections.map((s) => (
                  <a key={s.category} href={`#${s.category}`} className={styles.tab}>
                    {s.label}
                  </a>
                ))}
              </div>
            </nav>

            <ScrollReveal>
              <MenuList sections={sections} />
            </ScrollReveal>

            <p className={styles.footnote}>
              <strong>Allergene:</strong> A Gluten · B Krustentiere · C Eier · D Fisch · E Erdnüsse ·
              F Soja · G Laktose · H Nüsse · I Sellerie · J Senf · K Sesam · L Sulfite · N Lupinen ·
              O Weichtiere.
            </p>
          </>
        )}
      </main>

      <ScrollReveal>
        <CtaBand
          eyebrow="Reservieren"
          title="Lust bekommen?"
          body="Sichere dir deinen Tisch — wenige Klicks, kurze Bestätigung per E-Mail."
          primary={{ label: 'Tisch reservieren', href: '/reservierung' }}
          variant="inverse"
        />
      </ScrollReveal>

      <FloatingReserveCta />
    </SiteChrome>
  )
}
