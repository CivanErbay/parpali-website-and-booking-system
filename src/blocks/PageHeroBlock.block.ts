import type { Block } from 'payload'

export const PageHeroBlock: Block = {
  slug: 'page-hero',
  labels: { singular: 'Seiten-Header', plural: 'Seiten-Header' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow (Kategorie oben)' },
    { name: 'titleItalic', type: 'text', label: 'Kursiver Titelanteil (vorne, optional)' },
    { name: 'title', type: 'text', label: 'Titeltext (Hauptteil, nach dem kursiven)' },
    { name: 'lead', type: 'textarea', label: 'Lead-Text (optional)' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Hintergrundbild (optional, z.B. für Über-uns-Hero)' },
  ],
}
