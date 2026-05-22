export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { fontVariables } from '../../shared/fonts'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Reservierung',
  robots: { index: false, follow: false },
}

/**
 * Minimal shell for the embeddable booking widget (ADR-0012). No SiteChrome,
 * no SmoothScroll — it renders inside a host page's iframe. data-mode is set
 * on the widget wrapper itself so query-param theming can flip it per host.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
