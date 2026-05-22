import Link from 'next/link'
import styles from './CtaBand.module.css'

export interface CtaBandProps {
  eyebrow?: string
  title: string
  body?: string
  primary: { label: string; href: string }
  secondary?: { label: string; href: string }
  /** 'elev' (subtle bg) | 'inverse' (dark band) */
  variant?: 'elev' | 'inverse'
}

export function CtaBand({
  eyebrow,
  title,
  body,
  primary,
  secondary,
  variant = 'elev',
}: CtaBandProps) {
  return (
    <section className={`${styles.band} ${styles[variant]}`} aria-labelledby="cta-title">
      <div className={styles.inner}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h2 className={styles.title} id="cta-title">
          {title}
        </h2>
        {body ? <p className={styles.body}>{body}</p> : null}
        <div className={styles.ctas}>
          <Link href={primary.href} className={styles.primary}>
            {primary.label}
          </Link>
          {secondary ? (
            <Link href={secondary.href} className={styles.secondary}>
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
