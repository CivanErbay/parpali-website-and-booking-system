import type { Block } from 'payload'

export const IntroBlock: Block = {
  slug: 'intro',
  labels: { singular: 'Intro', plural: 'Intros' },
  fields: [
    {
      name: 'surface',
      type: 'select',
      options: [
        { label: 'Tight (default)', value: 'tight' },
        { label: 'Elevated', value: 'elev' },
      ],
      defaultValue: 'tight',
    },
    { name: 'eyebrowNum', type: 'text', required: true },
    { name: 'eyebrowLabel', type: 'text', required: true },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
  ],
}
