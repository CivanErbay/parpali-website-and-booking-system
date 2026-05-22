'use client'

import { useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import { ANIM } from '../../shared/animations'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export interface ScrollRevealProps {
  children: ReactNode
  className?: string
  as?: keyof React.JSX.IntrinsicElements
  stagger?: boolean
  delay?: number
}

export function ScrollReveal({
  children,
  className,
  as = 'div',
  stagger = false,
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const Tag = as as 'div'

  useGSAP(
    () => {
      if (!ref.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const targets = stagger
          ? ref.current!.querySelectorAll<HTMLElement>('[data-reveal]')
          : [ref.current!]
        gsap.from(targets, {
          y: ANIM.reveal.y,
          opacity: 0,
          duration: ANIM.reveal.duration,
          stagger: stagger ? ANIM.reveal.stagger : 0,
          delay,
          ease: ANIM.reveal.ease,
          scrollTrigger: {
            trigger: ref.current,
            start: ANIM.reveal.start,
            toggleActions: 'play none none reverse',
          },
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [stagger, delay] }
  )

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  )
}
