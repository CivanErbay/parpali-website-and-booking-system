import type { Block } from 'payload'

export const PullQuoteBlock: Block = {
  slug: 'pull-quote',
  labels: { singular: 'Zitat', plural: 'Zitate' },
  fields: [
    { name: 'quote', type: 'text', required: true },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'elev',
      options: [
        { label: 'Erhöht (heller Hintergrund)', value: 'elev' },
        { label: 'Kompakt', value: 'tight' },
      ],
    },
  ],
}
