import type { Block } from 'payload'

export const StoryTextBlock: Block = {
  slug: 'story-text',
  labels: { singular: 'Story-Text', plural: 'Story-Texte' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow (kleine Überzeile)' },
    {
      name: 'paragraphs',
      type: 'array',
      label: 'Absätze',
      fields: [
        { name: 'text', type: 'textarea', label: 'Text', required: true },
      ],
    },
  ],
}
