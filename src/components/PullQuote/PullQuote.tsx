import styles from './PullQuote.module.css'

export interface PullQuoteProps {
  quote: string
  attribution?: string
  variant?: 'elev' | 'inverse'
}

export function PullQuote({ quote, attribution, variant = 'elev' }: PullQuoteProps) {
  return (
    <section className={`${styles.section} ${styles[variant]}`}>
      <div className={styles.inner}>
        <span className={styles.glyph} aria-hidden="true">&ldquo;</span>
        <blockquote className={styles.quote}>{quote}</blockquote>
        {attribution ? <cite className={styles.attribution}>— {attribution}</cite> : null}
      </div>
    </section>
  )
}
