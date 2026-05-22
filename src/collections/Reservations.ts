import type { CollectionConfig } from 'payload'
import { reservationDerivedFields } from './hooks/reservationDerivedFields'

/**
 * Reservations are written by the public booking form via the local API
 * (overrideAccess), so create access is intentionally false at the REST layer.
 * Only authenticated admins can read/edit. Table assignment, the 2.5h hold
 * window, and the guest cancel token are per ADR-0012.
 */
export const Reservations: CollectionConfig = {
  slug: 'reservations',
  labels: { singular: 'Reservierung', plural: 'Reservierungen' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['date', 'time', 'name', 'partySize', 'assignedTables', 'status', 'createdAt'],
    group: 'Gäste',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [reservationDerivedFields],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
        { name: 'time', type: 'text', required: true, admin: { description: 'Format HH:mm (24h).' } },
        { name: 'partySize', type: 'number', required: true, min: 1, max: 30 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', required: true },
      ],
    },
    { name: 'notes', type: 'textarea' },
    {
      name: 'assignedTables',
      type: 'relationship',
      relationTo: 'tables',
      hasMany: true,
      label: 'Zugewiesene Tische',
      admin: {
        description: 'Automatisch per Best-Fit zugeteilt — im Dashboard manuell überschreibbar.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'holdUntil',
          type: 'date',
          label: 'Tisch belegt bis',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
            description: 'Abgeleitet aus Datum + Uhrzeit + Haltezeit.',
          },
        },
        {
          name: 'assignmentMode',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Automatisch (Best-Fit)', value: 'auto' },
            { label: 'Manuell überschrieben', value: 'manual' },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Bestätigt', value: 'confirmed' },
        { label: 'Erschienen', value: 'seated' },
        { label: 'Abgeschlossen', value: 'completed' },
        { label: 'No-Show', value: 'no-show' },
        { label: 'Storniert', value: 'cancelled' },
      ],
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'web',
      options: [
        { label: 'Online', value: 'web' },
        { label: 'Telefon', value: 'phone' },
        { label: 'Walk-in', value: 'walkin' },
      ],
    },
    {
      name: 'cancelToken',
      type: 'text',
      index: true,
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'reminderSentAt',
      type: 'date',
      admin: {
        readOnly: true,
        hidden: true,
        description: 'Zeitpunkt der versendeten Erinnerungs-Mail (für Idempotenz des Cron-Jobs).',
      },
    },
  ],
  indexes: [
    { fields: ['date', 'time'] },
    { fields: ['date', 'holdUntil'] },
  ],
}
