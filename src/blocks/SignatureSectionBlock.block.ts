import type { Block } from 'payload'

export const SignatureSectionBlock: Block = {
  slug: 'home-signature',
  labels: { singular: 'Signature-Sektion', plural: 'Signature-Sektionen' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow' },
    { name: 'title', type: 'text', label: 'Titel' },
    { name: 'lead', type: 'textarea', label: 'Lead-Text (optional)' },
  ],
}
