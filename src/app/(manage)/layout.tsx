export const dynamic = 'force-dynamic'

import type { Metadata, Viewport } from 'next'
import { fontVariables } from '../../shared/fonts'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Parpali · Reservierungen',
  robots: { index: false, follow: false },
  // Installierbar als App (PWA) — nur das Dashboard, siehe manifest.webmanifest/route.ts
  manifest: '/manage/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Parpali', statusBarStyle: 'default' },
  icons: { apple: '/manage/apple-touch-icon.png', icon: '/manage/icon-192.png' },
}

export const viewport: Viewport = {
  themeColor: '#f5f0e4',
}

/**
 * Route group shell for the owner dashboard (ADR-0013). Owns its own
 * <html><body> like (site)/(payload). No SmoothScroll — a dense data
 * dashboard uses native scrolling. Auth is gated one level down in (authed).
 */
export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-mode="light" className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
