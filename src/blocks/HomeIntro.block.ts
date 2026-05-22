import type { Block } from 'payload'

export const HomeIntroBlock: Block = {
  slug: 'home-intro',
  labels: { singular: 'Intro-Abschnitt', plural: 'Intro-Abschnitte' },
  fields: [
    {
      name: 'quote',
      type: 'text',
      required: true,
      admin: { description: 'Großes Kursiv-Zitat links (ohne Anführungszeichen)' },
    },
    {
      name: 'paragraphs',
      type: 'array',
      label: 'Absätze',
      minRows: 1,
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
  ],
}
