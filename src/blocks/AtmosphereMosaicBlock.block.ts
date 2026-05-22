import type { Block } from 'payload'

export const AtmosphereMosaicBlock: Block = {
  slug: 'atmosphere-mosaic',
  labels: { singular: 'Atmosphäre-Mosaik', plural: 'Atmosphäre-Mosaike' },
  fields: [
    {
      name: 'tiles',
      type: 'array',
      label: 'Bilder (max. 4)',
      minRows: 1,
      maxRows: 4,
      fields: [
        { name: 'url', type: 'text', required: true, admin: { description: 'Bild-URL (Unsplash oder S3-Upload-URL)' } },
        { name: 'alt', type: 'text', required: true, admin: { description: 'Bildbeschreibung für Screenreader' } },
      ],
    },
  ],
}
