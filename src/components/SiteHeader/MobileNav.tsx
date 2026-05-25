'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './MobileNav.module.css'

interface MobileNavProps {
  links: { label: string; href: string }[]
  activeHref?: string
}

export function MobileNav({ links, activeHref }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`${styles.bar} ${open ? styles.bar1Open : ''}`} />
        <span className={`${styles.bar} ${open ? styles.bar2Open : ''}`} />
        <span className={`${styles.bar} ${open ? styles.bar3Open : ''}`} />
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <nav
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-label="Mobile Navigation"
        aria-hidden={!open}
      >
        <ul className={styles.list}>
          {links.map((l) => (
            <li key={l.href + l.label}>
              <Link
                href={l.href}
                className={`${styles.link} ${l.href === activeHref ? styles.isActive : ''}`}
                onClick={() => setOpen(false)}
                aria-current={l.href === activeHref ? 'page' : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
