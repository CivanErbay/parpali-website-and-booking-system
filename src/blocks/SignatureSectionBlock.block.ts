import type { Block } from 'payload'

export const SignatureSectionBlock: Block = {
  slug: 'home-signature',
  labels: { singular: 'Signature-Sektion', plural: 'Signature-Sektionen' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow' },
    { name: 'title', type: 'text', label: 'Titel' },
    { name: 'lead', type: 'textarea', label: 'Lead-Text (optional)' },
    {
      name: 'items',
      type: 'array',
      label: 'Items',
      admin: {
        description:
          'Einzelne Items mit Bild — werden abwechselnd links/rechts dargestellt. Items ohne Bild werden übersprungen.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Eyebrow (Kategorie, optional)' },
        { name: 'title', type: 'text', label: 'Titel', required: true },
        { name: 'body', type: 'textarea', label: 'Text' },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Bild',
        },
        { name: 'meta', type: 'text', label: 'Meta-Zeile (z.B. „6,50 €", optional)' },
      ],
    },
  ],
}
