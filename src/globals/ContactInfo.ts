import type { GlobalConfig } from 'payload'

export const ContactInfo: GlobalConfig = {
  slug: 'contact-info',
  label: 'Kontakt & Adresse',
  admin: { group: 'Einstellungen' },
  access: { read: () => true },
  fields: [
    { name: 'restaurantName', type: 'text', required: true, defaultValue: 'Parpali' },
    {
      type: 'row',
      fields: [
        { name: 'street', type: 'text', required: true, defaultValue: 'Beispielstraße 1' },
        { name: 'zip', type: 'text', required: true, defaultValue: '10115' },
        { name: 'city', type: 'text', required: true, defaultValue: 'Berlin' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'whatsapp', type: 'text', admin: { description: 'WhatsApp-Nummer im internationalen Format ohne + (z.B. 4915123456789).' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'ownerName', type: 'text', label: 'Inhaber / Vertretungsberechtigte/r', admin: { description: 'Vollständiger Name für das Impressum.' } },
        { name: 'vatId', type: 'text', label: 'Umsatzsteuer-ID (USt-IdNr.)', admin: { description: 'z.B. DE123456789' } },
      ],
    },
    {
      name: 'maps',
      type: 'group',
      label: 'Google Maps',
      fields: [
        { name: 'directionsUrl', type: 'text', admin: { description: 'Maps-Link für „Route planen".' } },
        { name: 'embedUrl', type: 'text', admin: { description: 'Maps-Embed-URL (iframe src).' } },
      ],
    },
    {
      name: 'social',
      type: 'array',
      labels: { singular: 'Social Link', plural: 'Social Links' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TripAdvisor', value: 'tripadvisor' },
            { label: 'Google', value: 'google' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
