import type { Block } from 'payload'

export const HeroPageBlock: Block = {
  slug: 'hero-page',
  labels: { singular: 'Hero Page', plural: 'Hero Pages' },
  fields: [
    { name: 'eyebrow', type: 'text', required: true },
    { name: 'heading', type: 'text', required: true },
    { name: 'sub', type: 'textarea', required: true },
    { name: 'ctaText', type: 'text' },
    { name: 'ctaHref', type: 'text' },
  ],
}
