import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: { group: 'Einstellungen' },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'brandText', type: 'text', defaultValue: 'Parpali' },
    {
      name: 'mode',
      type: 'select',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
      defaultValue: 'dark',
    },
    {
      name: 'columns',
      type: 'array',
      labels: { singular: 'Spalte', plural: 'Spalten' },
      fields: [
        { name: 'heading', type: 'text', required: true, localized: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    { name: 'bottomLeft', type: 'text', localized: true },
    { name: 'bottomRight', type: 'text', localized: true },
  ],
}
