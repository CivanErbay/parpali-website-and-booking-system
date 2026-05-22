import type { CollectionConfig } from 'payload'

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: 'Anfrage', plural: 'Anfragen' },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'name', 'eventType', 'status', 'createdAt'],
    group: 'Gäste',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
      ],
    },
    { name: 'subject', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'eventType',
      type: 'select',
      options: [
        { label: 'Private Dining', value: 'private-dining' },
        { label: 'Weinabend', value: 'weinabend' },
        { label: 'Catering', value: 'catering' },
        { label: 'Firmenfeier', value: 'firmenfeier' },
        { label: 'Allgemein', value: 'general' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'Neu', value: 'new' },
        { label: 'In Bearbeitung', value: 'in-progress' },
        { label: 'Beantwortet', value: 'answered' },
        { label: 'Geschlossen', value: 'closed' },
      ],
    },
  ],
}
