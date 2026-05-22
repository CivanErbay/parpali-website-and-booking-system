'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import styles from './FloatingReserveCta.module.css'
import { ANIM } from '../../shared/animations'

export interface FloatingReserveCtaProps {
  label?: string
  href?: string
  /** Routes where the floating CTA must NOT appear (defaults to /reservierung) */
  hideOn?: string[]
}

export function FloatingReserveCta({
  label = 'Tisch reservieren',
  href = '/reservierung',
  hideOn = ['/reservierung'],
}: FloatingReserveCtaProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const path = usePathname()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (hideOn.includes(path ?? '')) {
      setVisible(false)
      return
    }

    let scheduled = false
    const onScroll = () => {
      if (scheduled) return
      scheduled = true
      rafRef.current = requestAnimationFrame(() => {
        const trigger = window.innerHeight * ANIM.floatingCta.appearAfter
        setVisible(window.scrollY > trigger)
        scheduled = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [path, hideOn])

  if (dismissed || hideOn.includes(path ?? '')) return null

  return (
    <div
      className={`${styles.wrap} ${visible ? styles.visible : ''}`}
      aria-hidden={!visible}
    >
      <Link href={href} className={styles.cta} tabIndex={visible ? 0 : -1}>
        <span>{label}</span>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <button
        type="button"
        className={styles.close}
        onClick={() => setDismissed(true)}
        aria-label="Schließen"
        tabIndex={visible ? 0 : -1}
      >
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
