import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: { group: 'Einstellungen' },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'brandText', type: 'text', defaultValue: 'Parpali' },
    { name: 'brandHref', type: 'text', defaultValue: '/' },
    {
      name: 'links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      defaultValue: [
        { label: 'Speisekarte', href: '/menu' },
        { label: 'Reservierung', href: '/reservierung' },
        { label: 'Galerie', href: '/galerie' },
        { label: 'Über uns', href: '/ueber-uns' },
        { label: 'Kontakt', href: '/kontakt' },
      ],
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    { name: 'ctaText', type: 'text', defaultValue: 'Tisch reservieren', localized: true },
    { name: 'ctaHref', type: 'text', defaultValue: '/reservierung' },
  ],
}
