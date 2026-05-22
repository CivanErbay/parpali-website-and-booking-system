import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { Blocks } from '../../../blocks/Blocks'
import { SiteChrome } from '../_chrome/SiteChrome'

/**
 * Catch-all for Pages documents. Any `/<slug>` not handled by an explicit
 * route (e.g., `/component-library`, `/article`) lands here and resolves
 * against the `pages` collection.
 *
 * See ADR-0008.
 */
type Args = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const page = docs[0]
  if (!page) return {}
  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description ?? undefined,
  }
}

export default async function SlugPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  const page = docs[0]
  if (!page) notFound()

  return (
    <SiteChrome activeHref={`/${slug}`}>
      <Blocks layout={page.layout as never} />
    </SiteChrome>
  )
}
