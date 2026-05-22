'use client'

import { useEffect, useRef } from 'react'
import styles from './WidgetFrame.module.css'

interface WidgetFrameProps {
  mode: 'light' | 'dark'
  themeVars: Record<string, string>
  restaurantName: string
  headline: string
  logoUrl?: string
  children: React.ReactNode
}

/**
 * Themed wrapper for the embeddable booking widget. Applies the host-supplied
 * theme as CSS custom-property overrides (the BookingForm CSS reads var(--…)),
 * and reports its height to the host page via postMessage so the iframe can
 * auto-resize.
 */
export function WidgetFrame({
  mode,
  themeVars,
  restaurantName,
  headline,
  logoUrl,
  children,
}: WidgetFrameProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined' || window.parent === window) return
    const report = () => {
      window.parent.postMessage(
        { type: 'parpali-widget-resize', height: Math.ceil(el.getBoundingClientRect().height) },
        '*',
      )
    }
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={styles.root}
      data-mode={mode}
      style={themeVars as React.CSSProperties}
    >
      <header className={styles.head}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={restaurantName} className={styles.logo} />
        ) : (
          <span className={styles.brand}>{restaurantName}</span>
        )}
        <h1 className={styles.headline}>{headline}</h1>
      </header>
      {children}
    </div>
  )
}
