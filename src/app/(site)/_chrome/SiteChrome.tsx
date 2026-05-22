import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

import { SiteHeader } from '../../../components/SiteHeader/SiteHeader'
import { SiteFooter } from '../../../components/SiteFooter/SiteFooter'

/**
 * Parpali site chrome — async server component that reads Navigation +
 * Footer Globals from Payload and renders <SiteHeader> + <SiteFooter>.
 *
 * `activeHref` stays a prop because it's per-route, not per-doc.
 */
export async function SiteChrome({
  children,
  activeHref,
}: {
  children: React.ReactNode
  activeHref?: string
}) {
  const payload = await getPayload({ config })
  const [nav, footer] = await Promise.all([
    payload.findGlobal({ slug: 'navigation' }),
    payload.findGlobal({ slug: 'footer' }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navLinks = (nav as any).links ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const footerColumns = ((footer as any).columns ?? []).map((col: any) => ({
    heading: col.heading,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    links: (col.links ?? []).map((l: any) => ({ label: l.label, href: l.href })),
  }))

  return (
    <>
      <SiteHeader
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        brandText={(nav as any).brandText ?? 'Parpali'}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        brandHref={(nav as any).brandHref ?? '/'}
        links={navLinks}
        activeHref={activeHref}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctaText={(nav as any).ctaText ?? 'Tisch reservieren'}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctaHref={(nav as any).ctaHref ?? '/reservierung'}
      />
      {children}
      <SiteFooter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mode={((footer as any).mode ?? 'dark') as 'dark' | 'light'}
        columns={footerColumns}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        brandText={(footer as any).brandText ?? 'Parpali'}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bottomLeft={(footer as any).bottomLeft ?? undefined}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bottomRight={(footer as any).bottomRight ?? undefined}
      />
    </>
  )
}
