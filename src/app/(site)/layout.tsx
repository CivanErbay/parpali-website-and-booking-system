export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { fontVariables } from '../../shared/fonts'
import { SmoothScroll } from '../../preview/SmoothScroll'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Parpali · Italienische & internationale Küche',
  description:
    'Parpali — italienische und internationale Küche. Hausgemachte Pasta, sorgfältig kuratierte Weinkarte. Jetzt online Tisch reservieren.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-mode="light" className={fontVariables}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  )
}
