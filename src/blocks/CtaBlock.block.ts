import type { Block } from 'payload'

export const CtaBlockBlock: Block = {
  slug: 'cta-block',
  labels: { singular: 'CTA Block', plural: 'CTA Blocks' },
  fields: [
    { name: 'meta', type: 'text', required: true },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'ctaText', type: 'text', required: true },
    { name: 'ctaHref', type: 'text', required: true },
  ],
}
