import styles from './FaqEditorial.module.css'

export interface FaqItem {
  q: string
  a: string
}

export interface FaqEditorialProps {
  eyebrow?: string
  title?: string
  items: FaqItem[]
}

export function FaqEditorial({
  eyebrow = 'FAQ',
  title = 'Häufige Fragen',
  items,
}: FaqEditorialProps) {
  return (
    <section className={styles.section} aria-labelledby="faq-title">
      <header className={styles.head}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.title} id="faq-title">{title}</h2>
      </header>
      <div className={styles.list}>
        {items.map((it, i) => (
          <details key={i} className={styles.item}>
            <summary className={styles.summary}>
              <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.question}>{it.q}</span>
              <svg
                className={styles.icon}
                viewBox="0 0 20 20"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M4 10h12M10 4v12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </summary>
            <div className={styles.answer}>
              <p>{it.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
