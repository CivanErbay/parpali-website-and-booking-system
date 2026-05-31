'use client'

import { useState } from 'react'
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

/**
 * Speisekarte as collapsible accordions (one per category). Categories — and
 * their dish counts — stay visible; the long item lists hide behind a smooth
 * grid-rows disclosure so the page reads calmly instead of dumping ~150 dishes
 * at once. Native-button + aria-expanded for accessibility; reduced-motion is
 * handled in the stylesheet. A sticky quick-index jumps to (and opens) a
 * category.
 */
export function MenuList({ sections }: { sections: MenuListSection[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  const allOpen = sections.length > 0 && sections.every((s) => open.has(s.category))

  const toggle = (category: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })

  const setAll = (openAll: boolean) =>
    setOpen(openAll ? new Set(sections.map((s) => s.category)) : new Set())

  const jumpTo = (category: string) => {
    setOpen((prev) => new Set(prev).add(category))
    // Defer scroll until the panel has begun opening.
    requestAnimationFrame(() => {
      document.getElementById(`cat-${category}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className={styles.root}>
      <nav className={styles.index} aria-label="Kategorien">
        <div className={styles.indexInner}>
          {sections.map((s) => (
            <button key={s.category} type="button" className={styles.indexChip} onClick={() => jumpTo(s.category)}>
              {s.label}
            </button>
          ))}
        </div>
        <button type="button" className={styles.toggleAll} onClick={() => setAll(!allOpen)}>
          {allOpen ? 'Alle zuklappen' : 'Alle aufklappen'}
        </button>
      </nav>

      <div className={styles.list}>
        {sections.map((section) => {
          const isOpen = open.has(section.category)
          const panelId = `panel-${section.category}`
          const btnId = `btn-${section.category}`
          return (
            <section key={section.category} id={`cat-${section.category}`} className={styles.section}>
              <h2 className={styles.sectionHead}>
                <button
                  type="button"
                  id={btnId}
                  className={styles.summary}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(section.category)}
                >
                  <span className={styles.sectionTitle}>{section.label}</span>
                  <span className={styles.count}>{section.items.length}</span>
                  <svg className={styles.icon} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                    <path d="M4 10h12M10 4v12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </h2>

              <div
                className={styles.panel}
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                data-open={isOpen ? 'true' : undefined}
              >
                <div className={styles.panelInner}>
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
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
