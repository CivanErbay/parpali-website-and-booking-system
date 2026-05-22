import React from 'react'
import Link from 'next/link'
import styles from './SiteHeader.module.css'
import { buildColorStyle, SectionColors } from '../../shared/colors'
import { ModeSwitcher } from '../ModeSwitcher/ModeSwitcher'

export interface SiteHeaderLink {
  label: string
  href: string
}

export interface SiteHeaderProps extends SectionColors {
  brandText: string
  brandHref: string
  links: SiteHeaderLink[]
  activeHref?: string
  ctaText: string
  ctaHref: string
  showModeSwitcher?: boolean
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  brandText,
  brandHref,
  links,
  activeHref,
  ctaText,
  ctaHref,
  bgColor,
  textColor,
  accentColor,
  mutedColor,
  showModeSwitcher = true,
}) => (
  <header
    className={styles.header}
    style={buildColorStyle({ bgColor, textColor, accentColor, mutedColor })}
  >
    <div className={styles.row}>
      <Link href={brandHref} className={styles.mark}>
        <span className={styles.markItalic}>{brandText}</span>
      </Link>
      <nav className={styles.links} aria-label="Hauptnavigation">
        {links.map((l) => (
          <Link
            key={l.href + l.label}
            href={l.href}
            className={`${styles.link} ${l.href === activeHref ? styles.isActive : ''}`}
            aria-current={l.href === activeHref ? 'page' : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className={styles.right}>
        {showModeSwitcher ? <ModeSwitcher /> : null}
        <Link href={ctaHref} className={styles.cta}>
          {ctaText}
        </Link>
      </div>
    </div>
  </header>
)
