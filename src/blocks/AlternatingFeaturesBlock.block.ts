import type { Block } from 'payload'

export const AlternatingFeaturesBlock: Block = {
  slug: 'alternating-features',
  labels: { singular: 'Wechselnde Features', plural: 'Wechselnde Features' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Feature-Einträge',
      minRows: 1,
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Eyebrow (Kategorie, optional)' },
        { name: 'title', type: 'text', label: 'Titel', required: true },
        { name: 'body', type: 'textarea', label: 'Text' },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Bild',
          admin: { description: 'Bild aus der Mediathek wählen — Eintrag wird ohne Bild nicht angezeigt.' },
        },
        { name: 'price', type: 'text', label: 'Preis-Tag (optional, z.B. „6,50 €")' },
      ],
    },
  ],
}
