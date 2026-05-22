import styles from './MenuList.module.css'

export interface MenuListItem {
  id: string | number
  name: string
  description?: string | null
  price: number
  allergens?: string[] | null
  isVegetarian?: boolean | null
  isVegan?: boolean | null
  isSpicy?: boolean | null
}

export interface MenuListSection {
  category: string
  label: string
  items: MenuListItem[]
}

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'A',
  lactose: 'G',
  nuts: 'H',
  eggs: 'C',
  fish: 'D',
  shellfish: 'B',
  mollusks: 'O',
  soy: 'F',
  mustard: 'J',
  sulfites: 'L',
  celery: 'I',
  sesame: 'K',
  peanuts: 'E',
  lupins: 'N',
}

const formatPrice = (eur: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(eur)

export function MenuList({ sections }: { sections: MenuListSection[] }) {
  return (
    <div className={styles.root}>
      {sections.map((section) => (
        <section key={section.category} className={styles.section} id={section.category}>
          <h2 className={styles.sectionTitle}>{section.label}</h2>
          <ul className={styles.itemList}>
            {section.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <h3 className={styles.itemName}>
                    {item.name}
                    {item.isVegetarian ? <span className={styles.tag}>v</span> : null}
                    {item.isVegan ? <span className={styles.tag}>vg</span> : null}
                    {item.isSpicy ? <span className={styles.tag}>🌶</span> : null}
                  </h3>
                  <span className={styles.dots} aria-hidden="true" />
                  <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
                </div>
                {item.description ? (
                  <p className={styles.itemDescription}>
                    {item.description}
                    {item.allergens && item.allergens.length > 0 ? (
                      <span className={styles.allergens}>
                        {' '}
                        ({item.allergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(', ')})
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
