import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Resized variants — keeps hero/parallax images within GPU-composited
    // layer limits and cuts payload weight. Originals can be 6000px+.
    imageSizes: [
      { name: 'hero', width: 2560, position: 'centre' },
      { name: 'card', width: 1280, position: 'centre' },
      { name: 'thumb', width: 600, height: 600, position: 'centre' },
    ],
  },
}
