import type { CollectionConfig } from 'payload'

/**
 * Physical tables. Capacity drives per-table availability (ADR-0012); the
 * seat-pool model is gone. `combinesWith` is an explicit adjacency relationship
 * — only tables the owner declares as physically joinable may be combined for
 * large parties. `read` is public so the pure availability logic and the public
 * booking API can see the floor plan; mutations require an authenticated user.
 */
export const Tables: CollectionConfig = {
  slug: 'tables',
  labels: { singular: 'Tisch', plural: 'Tische' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'capacity', 'zone', 'combinable', 'active', 'sortOrder'],
    group: 'Gäste',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'Tischname/-nummer, z.B. „Tisch 1" oder „T7".' } },
        { name: 'capacity', type: 'number', required: true, min: 1, max: 20, defaultValue: 2, admin: { description: 'Plätze an diesem Tisch.' } },
        { name: 'sortOrder', type: 'number', required: true, defaultValue: 0, admin: { description: 'Reihenfolge im Dashboard (kleiner = weiter oben).' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'zone',
          type: 'select',
          defaultValue: 'main',
          options: [
            { label: 'Hauptraum', value: 'main' },
            { label: 'Terrasse', value: 'terrace' },
            { label: 'Bar', value: 'bar' },
            { label: 'Nebenraum', value: 'private' },
          ],
        },
        { name: 'combinable', type: 'checkbox', defaultValue: false, label: 'Kombinierbar' },
        { name: 'active', type: 'checkbox', defaultValue: true, label: 'Aktiv' },
      ],
    },
    {
      name: 'combinesWith',
      type: 'relationship',
      relationTo: 'tables',
      hasMany: true,
      label: 'Kombinierbar mit',
      admin: {
        description: 'Nur direkt benachbarte Tische, die physisch zusammengestellt werden können.',
        condition: (_, siblingData) => Boolean(siblingData?.combinable),
      },
    },
  ],
  indexes: [{ fields: ['active', 'sortOrder'] }],
}
