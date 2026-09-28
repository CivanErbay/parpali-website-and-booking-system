import { ScrollReveal } from '../ScrollReveal/ScrollReveal'
import styles from './StoryIntro.module.css'

export interface StoryIntroProps {
  eyebrow?: string
  /** First paragraph becomes the lead, the last one (from 3 on) the closing line. */
  paragraphs: string[]
}

export function StoryIntro({ eyebrow, paragraphs }: StoryIntroProps) {
  if (paragraphs.length === 0) return null

  const [lead, ...rest] = paragraphs
  const closing = rest.length >= 2 ? rest[rest.length - 1] : undefined
  const body = closing ? rest.slice(0, -1) : rest

  return (
    <section className={styles.story}>
      <ScrollReveal className={styles.art}>
        <OvenIllustration />
      </ScrollReveal>

      <ScrollReveal as="article" className={styles.text} stagger>
        {eyebrow ? <span className={styles.eyebrow} data-reveal>{eyebrow}</span> : null}
        <p className={styles.lead} data-reveal>{lead}</p>
        {rest.length > 0 ? <span className={styles.rule} aria-hidden="true" data-reveal /> : null}
        {body.map((text, i) => (
          <p key={i} className={styles.body} data-reveal>{text}</p>
        ))}
        {closing ? <p className={styles.closing} data-reveal>{closing}</p> : null}
      </ScrollReveal>
    </section>
  )
}

/** Line drawing of a wood-fired oven in an arched niche — decorative only. */
function OvenIllustration() {
  return (
    <svg className={styles.svg} viewBox="0 0 320 360" aria-hidden="true" focusable="false">
      <path className={styles.niche} d="M20 360V160a140 140 0 0 1 280 0v200Z" />

      {/* Olive sprig */}
      <g className={styles.sprig}>
        <path className={styles.thin} d="M28 158C58 128 86 112 124 104" />
        <ellipse className={styles.leaf} cx="46" cy="130" rx="13" ry="4" transform="rotate(-70 46 130)" />
        <ellipse className={styles.leaf} cx="58" cy="148" rx="13" ry="4" transform="rotate(25 58 148)" />
        <ellipse className={styles.leaf} cx="72" cy="112" rx="13" ry="4" transform="rotate(-55 72 112)" />
        <ellipse className={styles.leaf} cx="88" cy="130" rx="13" ry="4" transform="rotate(20 88 130)" />
        <ellipse className={styles.leaf} cx="104" cy="97" rx="12" ry="4" transform="rotate(-35 104 97)" />
        <ellipse className={styles.leaf} cx="118" cy="114" rx="11" ry="3.5" transform="rotate(15 118 114)" />
        <circle className={styles.olive} cx="74" cy="132" r="4" />
        <circle className={styles.olive} cx="97" cy="117" r="3.5" />
      </g>

      {/* Smoke */}
      <path className={styles.smoke} d="M182 70c-6-10 8-16 0-28s4-16 2-26" />
      <path className={styles.smoke} d="M194 64c-4-7 6-11 0-19" />

      {/* Chimney + dome */}
      <path className={styles.line} d="M172 111V78h20v35" />
      <path className={styles.line} d="M60 300v-90a100 100 0 0 1 200 0v90" />

      {/* Brick arch around the opening */}
      <path className={styles.line} d="M96 255a64 64 0 0 1 128 0" />
      <path
        className={styles.thin}
        d="M110 255H96M113.8 235.9l-12.9-5.4M124.6 219.6l-9.8-9.9M140.9 208.8l-5.4-12.9M160 205v-14M179.1 208.8l5.4-12.9M195.4 219.6l9.8-9.9M206.2 235.9l12.9-5.4M210 255h14"
      />
      <path className={styles.line} d="M110 300v-45a50 50 0 0 1 100 0v45" />

      {/* Fire */}
      <path className={styles.flameSoft} d="M118 300c-4-14 4-22 2-32 10 6 14 16 12 32Z" />
      <path className={styles.flame} d="M128 300c-8-18 6-28 2-46 14 10 18 0 16-16 18 14 24 40 12 62Z" />
      <path className={styles.flame} d="M160 300c-6-22 12-30 6-54 18 12 28 34 20 54Z" />
      <path className={styles.flameSoft} d="M184 300c0-12 10-18 6-30 12 8 16 20 12 30Z" />

      {/* Hearth + base */}
      <path className={styles.line} d="M40 300h240" />
      <path className={styles.line} d="M60 300v36h200v-36" />

      {/* Stacked logs */}
      <g className={styles.thin}>
        <circle cx="92" cy="324" r="7" />
        <circle cx="107" cy="324" r="7" />
        <circle cx="99.5" cy="311" r="7" />
        <circle cx="213" cy="324" r="7" />
        <circle cx="228" cy="324" r="7" />
        <circle cx="220.5" cy="311" r="7" />
      </g>
    </svg>
  )
}
