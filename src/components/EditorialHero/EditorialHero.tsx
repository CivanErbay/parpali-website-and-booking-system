'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

import styles from './EditorialHero.module.css'
import { ANIM } from '../../shared/animations'
import { ParallaxImage } from '../ParallaxImage/ParallaxImage'
import { MagneticButton } from '../MagneticButton/MagneticButton'

export interface EditorialHeroProps {
  brand: string
  tagline: string
  eyebrow?: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  imageUrl?: string
  imageAlt?: string
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1568571780765-9276107c0cab?auto=format&fit=crop&w=2600&q=80'

export function EditorialHero({
  brand,
  tagline,
  eyebrow,
  primaryCta,
  secondaryCta,
  imageUrl = DEFAULT_IMAGE,
  imageAlt = 'Toskanische Olivenhaine mit Zypressen',
}: EditorialHeroProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const letters = ref.current!.querySelectorAll<HTMLElement>('[data-letter]')
        const tagline = ref.current!.querySelector<HTMLElement>('[data-tagline]')
        const ctas = ref.current!.querySelector<HTMLElement>('[data-ctas]')
        const eye = ref.current!.querySelector<HTMLElement>('[data-eyebrow]')

        const tl = gsap.timeline({ defaults: { ease: ANIM.letterStagger.ease } })
        if (eye) tl.from(eye, { y: 14, opacity: 0, duration: 0.5 }, 0)
        if (letters.length)
          tl.from(letters, {
            y: ANIM.letterStagger.y,
            opacity: 0,
            duration: ANIM.letterStagger.duration,
            stagger: ANIM.letterStagger.stagger,
          }, 0.1)
        if (tagline) tl.from(tagline, { y: 20, opacity: 0, duration: 0.7 }, '-=0.45')
        if (ctas) tl.from(ctas, { y: 16, opacity: 0, duration: 0.5 }, '-=0.3')
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  const characters = Array.from(brand)

  return (
    <section ref={ref} className={styles.hero} aria-label="Willkommen">
      <ParallaxImage
        src={imageUrl}
        alt={imageAlt}
        className={styles.bg}
        eager
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.inner}>
        {eyebrow ? <span className={styles.eyebrow} data-eyebrow>{eyebrow}</span> : null}
        <h1 className={styles.brand} aria-label={brand}>
          {characters.map((ch, i) => (
            <span key={i} className={styles.letterWrap} aria-hidden="true">
              <span className={styles.letter} data-letter>
                {ch === ' ' ? ' ' : ch}
              </span>
            </span>
          ))}
        </h1>
        <p className={styles.tagline} data-tagline>{tagline}</p>
        <div className={styles.ctas} data-ctas>
          <MagneticButton href={primaryCta.href} variant="primary">{primaryCta.label}</MagneticButton>
          {secondaryCta ? (
            <MagneticButton href={secondaryCta.href} variant="secondary">{secondaryCta.label}</MagneticButton>
          ) : null}
        </div>
      </div>
      <a className={styles.scrollCue} href="#below" aria-label="Weiter scrollen">
        <span className={styles.scrollCueLine} aria-hidden="true" />
      </a>
    </section>
  )
}
