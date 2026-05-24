import type { Block } from 'payload'

export const TeamSectionBlock: Block = {
  slug: 'team-section',
  labels: { singular: 'Team-Sektion', plural: 'Team-Sektionen' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow (über Überschrift)' },
    { name: 'heading', type: 'text', label: 'Überschrift' },
    {
      name: 'members',
      type: 'array',
      label: 'Teammitglieder',
      fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'role', type: 'text', label: 'Rolle / Position' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Foto' },
      ],
    },
  ],
}
