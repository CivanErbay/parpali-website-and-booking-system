import type { CollectionConfig } from 'payload'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'source', 'rating', 'featured', 'updatedAt'],
    group: 'Inhalte',
  },
  access: { read: () => true },
  fields: [
    { name: 'quote', type: 'textarea', required: true, localized: true },
    { name: 'author', type: 'text', required: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'direct',
      options: [
        { label: 'Direkt', value: 'direct' },
        { label: 'Google', value: 'google' },
        { label: 'TripAdvisor', value: 'tripadvisor' },
        { label: 'Yelp', value: 'yelp' },
        { label: 'Falstaff', value: 'falstaff' },
        { label: 'Michelin', value: 'michelin' },
        { label: 'Presse', value: 'press' },
      ],
    },
    { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5 },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { description: 'In der Startseiten-Rotation anzeigen.' } },
  ],
}
