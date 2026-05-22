import type { Block } from 'payload'

export const FaqEditorialBlock: Block = {
  slug: 'faq-editorial',
  labels: { singular: 'FAQ-Abschnitt', plural: 'FAQ-Abschnitte' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Fragen & Antworten',
      minRows: 1,
      fields: [
        { name: 'q', type: 'text', required: true, label: 'Frage' },
        { name: 'a', type: 'textarea', required: true, label: 'Antwort' },
      ],
    },
  ],
}
