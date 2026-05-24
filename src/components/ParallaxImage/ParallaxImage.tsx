import styles from './ParallaxImage.module.css'

/**
 * Hero/cover image wrapper. Despite the historical name, the parallax scroll
 * effect has been removed — heroes now use a plain `object-fit: cover` image.
 * Kept as a wrapper component so the two consumers (EditorialHero, ueber-uns)
 * don't need to manage the inner `<img>` markup directly.
 */
export interface ParallaxImageProps {
  src: string
  alt?: string
  aspectRatio?: string
  className?: string
  /** Render the <img> with high fetch priority (use on hero). */
  eager?: boolean
}

export function ParallaxImage({
  src,
  alt = '',
  aspectRatio,
  className,
  eager = false,
}: ParallaxImageProps) {
  return (
    <div
      className={`${styles.wrap} ${className ?? ''}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <img
        src={src}
        alt={alt}
        className={styles.img}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
      />
    </div>
  )
}
