import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event-Format', plural: 'Event-Formate' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'eventType', 'updatedAt'],
    group: 'Inhalte',
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'description', type: 'textarea', required: true, localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Private Dining', value: 'private-dining' },
        { label: 'Weinabend', value: 'weinabend' },
        { label: 'Catering', value: 'catering' },
        { label: 'Firmenfeier', value: 'firmenfeier' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'minGuests', type: 'number', min: 1, label: 'Mind. Gäste' },
        { name: 'maxGuests', type: 'number', min: 1, label: 'Max. Gäste' },
      ],
    },
    {
      name: 'priceFrom',
      type: 'number',
      min: 0,
      admin: { description: 'Optional — "ab X € pro Person".' },
    },
  ],
}
