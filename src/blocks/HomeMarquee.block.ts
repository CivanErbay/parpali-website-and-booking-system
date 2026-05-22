import type { Block } from 'payload'

export const HomeMarqueeBlock: Block = {
  slug: 'home-marquee',
  labels: { singular: 'Laufschrift', plural: 'Laufschriften' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Wörter',
      minRows: 1,
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'variant',
      type: 'select',
      label: 'Schriftart',
      defaultValue: 'fraunces',
      options: [
        { label: 'Fraunces (kursiv)', value: 'fraunces' },
        { label: 'Sans (regular)', value: 'sans' },
      ],
    },
  ],
}
