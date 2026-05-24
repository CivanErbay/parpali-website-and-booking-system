import type { Block } from 'payload'

export const EditorialHeroBlock: Block = {
  slug: 'editorial-hero',
  labels: { singular: 'Editorial Hero', plural: 'Editorial Heroes' },
  fields: [
    { name: 'eyebrow', type: 'text', defaultValue: 'Toskana · Berlin', admin: { description: 'Kleiner Text über dem Titel, z.B. "Toskana · Berlin"' } },
    { name: 'brand', type: 'text', required: true, defaultValue: 'Parpali', admin: { description: 'Großer animierter Markenname' } },
    { name: 'tagline', type: 'textarea', required: true, admin: { description: 'Beschreibungstext unter dem Markennamen' } },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Hintergrundbild', admin: { description: 'Bild aus der Mediathek wählen oder hochladen (leer lassen für Standard-Bild)' } },
    {
      name: 'primaryCta',
      type: 'group',
      label: 'Haupt-Button',
      fields: [
        { name: 'label', type: 'text', required: true, defaultValue: 'Tisch reservieren' },
        { name: 'href', type: 'text', required: true, defaultValue: '/reservierung' },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      label: 'Zweiter Button',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'Speisekarte' },
        { name: 'href', type: 'text', defaultValue: '/menu' },
      ],
    },
  ],
}
