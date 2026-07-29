'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './ManageChrome.module.css'
import { isoToday, weekStart } from '../../../lib/dashboard'
import { EmergencyStopButton } from '../EmergencyStop/EmergencyStopButton'

type IconName = 'day' | 'week' | 'list' | 'tables' | 'hours' | 'settings' | 'contact' | 'stats'

/** Lucide-style 24×24 stroke icons — single source so stroke width stays consistent. */
const ICONS: Record<IconName, React.ReactNode> = {
  day: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>,
  week: <><path d="M3 4h18v16H3zM9 4v16M15 4v16" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
  tables: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  hours: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  settings: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
  contact: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  stats: <><path d="M4 20V10M12 20V4M20 20v-7" /></>,
}

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

interface NavItem {
  label: string
  href: string
  icon: IconName
  /** path prefix that marks this item active */
  match: string
}

export function ManageChrome({
  userEmail,
  initialEmergencyStop,
  children,
}: {
  userEmail: string
  initialEmergencyStop: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [emergencyStop, setEmergencyStop] = useState(initialEmergencyStop)

  const today = isoToday()
  const items: NavItem[] = [
    { label: 'Tag', href: `/manage/day/${today}`, icon: 'day', match: '/manage/day' },
    { label: 'Woche', href: `/manage/week/${weekStart(today)}`, icon: 'week', match: '/manage/week' },
    { label: 'Reservierungen', href: '/manage/reservations', icon: 'list', match: '/manage/reservations' },
    { label: 'Statistiken', href: '/manage/statistiken', icon: 'stats', match: '/manage/statistiken' },
    { label: 'Tische', href: '/manage/tables', icon: 'tables', match: '/manage/tables' },
    { label: 'Öffnungszeiten', href: '/manage/hours', icon: 'hours', match: '/manage/hours' },
    { label: 'Einstellungen', href: '/manage/settings', icon: 'settings', match: '/manage/settings' },
    { label: 'Kontakt', href: '/manage/kontakt', icon: 'contact', match: '/manage/kontakt' },
  ]

  async function handleLogout() {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } finally {
      router.replace('/manage/login')
      router.refresh()
    }
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>Parpali</span>
          <span className={styles.brandSub}>Reservierungen</span>
        </div>
        <nav className={styles.nav} aria-label="Dashboard-Navigation">
          {items.map((item) => {
            const active = pathname.startsWith(item.match)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                aria-current={active ? 'page' : undefined}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className={styles.footer}>
          <EmergencyStopButton active={emergencyStop} onChange={setEmergencyStop} />
          <span className={styles.user} title={userEmail}>
            {userEmail}
          </span>
          <button type="button" className={styles.logout} onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        {emergencyStop ? (
          <div className={styles.emergencyBanner} role="alert">
            ⚠ Reservierungsservice ist gestoppt — Gäste können aktuell nicht online buchen.
          </div>
        ) : null}
        {children}
      </main>
    </div>
  )
}
