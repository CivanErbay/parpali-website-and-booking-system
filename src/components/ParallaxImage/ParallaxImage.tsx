'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import styles from './ParallaxImage.module.css'
import { ANIM } from '../../shared/animations'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export interface ParallaxImageProps {
  src: string
  alt?: string
  aspectRatio?: string
  className?: string
  /** Override the global parallax speed (0..1). */
  speed?: number
  /** Render the <img> with high fetch priority (use on hero). */
  eager?: boolean
}

export function ParallaxImage({
  src,
  alt = '',
  aspectRatio,
  className,
  speed = ANIM.parallax.speed,
  eager = false,
}: ParallaxImageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useGSAP(
    () => {
      if (!wrapRef.current || !imgRef.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const distance = `-${Math.round(speed * 100)}%`
        const tween = gsap.fromTo(
          imgRef.current,
          { yPercent: 0 },
          {
            yPercent: parseFloat(distance),
            ease: 'none',
            scrollTrigger: {
              trigger: wrapRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
        return () => {
          tween.scrollTrigger?.kill()
          tween.kill()
        }
      })
      return () => mm.revert()
    },
    { scope: wrapRef, dependencies: [speed] },
  )

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ''}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={styles.img}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
      />
    </div>
  )
}
