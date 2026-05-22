import styles from './Marquee.module.css'

export interface MarqueeProps {
  /** Word list rendered in the strip (each becomes a separator-joined chunk). */
  items: string[]
  /** Override loop duration in seconds. Default uses ANIM.marquee.duration. */
  duration?: number
  /** Visual variant */
  variant?: 'fraunces' | 'sans'
  /** Reverse scroll direction */
  reverse?: boolean
}

export function Marquee({ items, duration = 32, variant = 'fraunces', reverse = false }: MarqueeProps) {
  const sep = ' · '
  const text = items.join(sep) + sep

  // Duplicate content twice for seamless loop
  return (
    <div
      className={`${styles.root} ${styles[variant]}`}
      style={{ ['--marquee-duration' as never]: `${duration}s` }}
      aria-hidden="true"
    >
      <div className={`${styles.track} ${reverse ? styles.reverse : ''}`}>
        <span className={styles.chunk}>{text}</span>
        <span className={styles.chunk}>{text}</span>
        <span className={styles.chunk}>{text}</span>
        <span className={styles.chunk}>{text}</span>
      </div>
    </div>
  )
}
