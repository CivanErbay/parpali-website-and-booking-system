import React from 'react'
import Link from 'next/link'
import styles from './SiteFooter.module.css'
import { buildColorStyle, SectionColors } from '../../shared/colors'
import { type SectionMode } from '../../shared/modes'

export interface FooterColumn {
  heading: string
  links: { label: string; href: string }[]
}

export interface SiteFooterProps extends SectionColors {
  mode?: SectionMode
  columns: FooterColumn[]
  brandText: string
  bottomLeft: string
  bottomRight: string
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  columns,
  brandText,
  bottomLeft,
  bottomRight,
  bgColor,
  textColor,
  accentColor,
  mutedColor,
}) => (
  <footer
    className={styles.footer}
    style={buildColorStyle({ bgColor, textColor, accentColor, mutedColor })}
  >
    <div className={styles.container}>
      <div className={styles.top}>
        <div className={styles.brandCol}>
          <Link href="/" className={styles.mark}>
            <span className={styles.markItalic}>{brandText}</span>
          </Link>
          <p className={styles.tagline}>
            Italienische &amp; internationale Küche.
          </p>
        </div>
        <div className={styles.grid}>
          {columns.map((col, i) => (
            <div key={i} className={styles.col}>
              <span className={styles.eyebrow}>{col.heading}</span>
              {col.links.map((l, j) => (
                <Link key={j} href={l.href} className={styles.link}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.bigMark} aria-hidden="true">{brandText}</div>
      <div className={styles.bottom}>
        <span>{bottomLeft}</span>
        <span>{bottomRight}</span>
      </div>
    </div>
  </footer>
)
