import styles from './AtmosphereMosaic.module.css'
import { ClipReveal } from '../ClipReveal/ClipReveal'

export interface MosaicTile {
  url: string
  alt?: string
  /** Optional grid-area override; defaults are baked in for the 4 slots. */
  area?: string
}

export interface AtmosphereMosaicProps {
  tiles: MosaicTile[]
}

export function AtmosphereMosaic({ tiles }: AtmosphereMosaicProps) {
  return (
    <section className={styles.section} aria-label="Eindrücke">
      <div className={styles.grid}>
        {tiles.slice(0, 4).map((t, i) => (
          <ClipReveal
            key={i}
            from={i % 2 === 0 ? 'up' : 'left'}
            className={`${styles.tile} ${styles[`tile${i + 1}`]}`}
          >
            <img src={t.url} alt={t.alt ?? ''} loading="lazy" />
          </ClipReveal>
        ))}
      </div>
    </section>
  )
}
