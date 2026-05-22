import styles from './MapEmbed.module.css'

export interface MapEmbedProps {
  /** Google Maps embed iframe URL */
  embedUrl: string
  /** Address shown above the map */
  address?: string
  /** Accessible iframe title */
  title?: string
  /** Optional aspect ratio (default 16/9; on mobile collapses to 4/3) */
  aspectRatio?: string
}

export function MapEmbed({
  embedUrl,
  address,
  title = 'Standort auf der Karte',
  aspectRatio = '16 / 9',
}: MapEmbedProps) {
  return (
    <figure className={styles.figure}>
      {address ? <figcaption className={styles.caption}>{address}</figcaption> : null}
      <div className={styles.frame} style={{ aspectRatio }}>
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className={styles.iframe}
        />
      </div>
    </figure>
  )
}
