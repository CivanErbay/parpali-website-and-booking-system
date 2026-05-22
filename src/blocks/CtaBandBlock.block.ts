import type { Block } from 'payload'

export const CtaBandBlock: Block = {
  slug: 'cta-band',
  labels: { singular: 'CTA-Band', plural: 'CTA-Bänder' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow (klein, oben)' },
    { name: 'title', type: 'text', required: true, label: 'Überschrift' },
    { name: 'body', type: 'textarea', label: 'Fließtext' },
    {
      name: 'primary',
      type: 'group',
      label: 'Haupt-Button',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'secondary',
      type: 'group',
      label: 'Zweiter Button (optional)',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'inverse',
      options: [
        { label: 'Invers (dunkel)', value: 'inverse' },
        { label: 'Erhöht', value: 'elev' },
        { label: 'Standard', value: '' },
      ],
    },
  ],
}
