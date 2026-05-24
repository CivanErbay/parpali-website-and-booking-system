import type { Block } from 'payload'

export const StoryTextBlock: Block = {
  slug: 'story-text',
  labels: { singular: 'Story-Text', plural: 'Story-Texte' },
  fields: [
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
