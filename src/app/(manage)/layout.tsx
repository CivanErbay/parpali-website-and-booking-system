export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { fontVariables } from '../../shared/fonts'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Parpali · Reservierungen',
  robots: { index: false, follow: false },
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
