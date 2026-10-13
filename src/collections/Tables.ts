import type { CollectionConfig } from 'payload'

/**
 * Physical tables. Capacity drives per-table availability (ADR-0012); the
 * seat-pool model is gone. Which tables may be pushed together lives in the
 * `tableCombos` list of the BookingSettings global. `read` is public so the pure availability logic and the public
 * booking API can see the floor plan; mutations require an authenticated user.
 */
export const Tables: CollectionConfig = {
  slug: 'tables',
  labels: { singular: 'Tisch', plural: 'Tische' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'capacity', 'zone', 'active', 'sortOrder'],
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
          label: 'Bereich',
          defaultValue: 'main',
          options: [
            { label: 'Innen', value: 'main' },
            { label: 'Außen', value: 'terrace' },
          ],
        },
        { name: 'active', type: 'checkbox', defaultValue: true, label: 'Aktiv' },
      ],
    },
  ],
  indexes: [{ fields: ['active', 'sortOrder'] }],
}
