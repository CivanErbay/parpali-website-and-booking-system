import type { Block } from 'payload'

export const AtmosphereMosaicBlock: Block = {
  slug: 'atmosphere-mosaic',
  labels: { singular: 'Atmosphäre-Mosaik', plural: 'Atmosphäre-Mosaike' },
  fields: [
    {
      name: 'tiles',
      type: 'array',
      label: 'Bilder (max. 4)',
      maxRows: 4,
      admin: { description: 'Leer lassen für Standard-Bilder; sonst 1–4 Bilder aus der Mediathek.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Bild' },
      ],
    },
  ],
}
