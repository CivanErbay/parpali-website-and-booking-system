import styles from './AlternatingFeature.module.css'
import { ClipReveal } from '../ClipReveal/ClipReveal'

export interface AlternatingFeatureProps {
  /** Position of the image. */
  imageSide: 'left' | 'right'
  imageUrl: string
  imageAlt?: string
  eyebrow?: string
  title: string
  body?: string
  meta?: string  // e.g. a price, a price tag, "Antipasti · €12,50"
  href?: string
}

export function AlternatingFeature({
  imageSide,
  imageUrl,
  imageAlt = '',
  eyebrow,
  title,
  body,
  meta,
  href,
}: AlternatingFeatureProps) {
  const TitleEl: 'a' | 'h3' = href ? 'a' : 'h3'

  return (
    <section
      className={`${styles.section} ${imageSide === 'right' ? styles.flip : ''}`}
    >
      <ClipReveal from={imageSide === 'left' ? 'right' : 'left'} className={styles.imageCol}>
        <img src={imageUrl} alt={imageAlt} loading="lazy" />
      </ClipReveal>

      <div className={styles.textCol}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        {href ? (
          <a href={href} className={styles.title}>{title}</a>
        ) : (
          <h3 className={styles.title}>{title}</h3>
        )}
        {body ? <p className={styles.body}>{body}</p> : null}
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </div>
    </section>
  )
}
