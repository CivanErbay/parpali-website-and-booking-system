'use client'

import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

import styles from './MagneticButton.module.css'
import { ANIM } from '../../shared/animations'

export interface MagneticButtonProps {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
  /** External link target */
  external?: boolean
  /** Override strength (0..1) */
  strength?: number
}

/**
 * CTA wrapper that translates subtly toward the cursor on hover.
 * No-op under reduced motion. Works as a link.
 */
export function MagneticButton({
  href,
  children,
  variant = 'primary',
  className,
  external = false,
  strength = ANIM.magnetic.strength,
}: MagneticButtonProps) {
  const outerRef = useRef<HTMLAnchorElement | null>(null)
  const innerRef = useRef<HTMLSpanElement | null>(null)

  useGSAP(
    () => {
      if (!outerRef.current || !innerRef.current) return
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const setX = gsap.quickTo(innerRef.current, 'x', { duration: ANIM.magnetic.duration, ease: ANIM.magnetic.ease })
        const setY = gsap.quickTo(innerRef.current, 'y', { duration: ANIM.magnetic.duration, ease: ANIM.magnetic.ease })

        const handleMove = (e: PointerEvent) => {
          const rect = outerRef.current!.getBoundingClientRect()
          const relX = e.clientX - rect.left - rect.width / 2
          const relY = e.clientY - rect.top - rect.height / 2
          setX(relX * strength)
          setY(relY * strength)
        }
        const handleLeave = () => {
          setX(0)
          setY(0)
        }
        outerRef.current!.addEventListener('pointermove', handleMove)
        outerRef.current!.addEventListener('pointerleave', handleLeave)
        return () => {
          outerRef.current?.removeEventListener('pointermove', handleMove)
          outerRef.current?.removeEventListener('pointerleave', handleLeave)
        }
      })
      return () => mm.revert()
    },
    { scope: outerRef, dependencies: [strength] },
  )

  const cls = `${styles.btn} ${variant === 'primary' ? styles.primary : styles.secondary} ${className ?? ''}`

  if (external) {
    return (
      <a
        ref={outerRef}
        href={href}
        className={cls}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span ref={innerRef} className={styles.inner}>{children}</span>
      </a>
    )
  }
  return (
    <Link href={href} className={cls} ref={outerRef as never}>
      <span ref={innerRef} className={styles.inner}>{children}</span>
    </Link>
  )
}
