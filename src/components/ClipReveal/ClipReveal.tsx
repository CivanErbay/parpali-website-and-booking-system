'use client'

import { useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import { ANIM } from '../../shared/animations'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export interface ClipRevealProps {
  children: ReactNode
  className?: string
  /** Reveal direction. 'up' = clip from bottom upward; 'down' = clip from top downward. */
  from?: 'up' | 'down' | 'left' | 'right'
  delay?: number
}

const INSET = {
  up:    { start: 'inset(100% 0 0 0)', end: 'inset(0% 0 0 0)' },
  down:  { start: 'inset(0 0 100% 0)', end: 'inset(0 0 0% 0)' },
  left:  { start: 'inset(0 100% 0 0)', end: 'inset(0 0% 0 0)' },
  right: { start: 'inset(0 0 0 100%)', end: 'inset(0 0 0 0%)' },
}

export function ClipReveal({ children, className, from = 'up', delay = 0 }: ClipRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tween = gsap.fromTo(
          ref.current,
          { clipPath: INSET[from].start, webkitClipPath: INSET[from].start },
          {
            clipPath: INSET[from].end,
            webkitClipPath: INSET[from].end,
            duration: ANIM.clipReveal.duration,
            ease: ANIM.clipReveal.ease,
            delay,
            scrollTrigger: {
              trigger: ref.current,
              start: ANIM.clipReveal.start,
              toggleActions: 'play none none reverse',
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
    { scope: ref, dependencies: [from, delay] },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
