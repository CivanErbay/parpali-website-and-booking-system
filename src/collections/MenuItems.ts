import type { CollectionConfig } from 'payload'

export const MENU_CATEGORIES = [
  { label: 'Suppen', value: 'suppen' },
  { label: 'Antipasti', value: 'antipasti' },
  { label: 'Salate', value: 'salate' },
  { label: 'Pasta', value: 'pasta' },
  { label: 'Ofenkartoffeln', value: 'ofenkartoffeln' },
  { label: 'Schnitzel', value: 'schnitzel' },
  { label: 'Burger', value: 'burger' },
  { label: 'Fischgerichte', value: 'fisch' },
  { label: 'Grillgerichte', value: 'grill' },
  { label: 'Rumpsteak', value: 'rumpsteak' },
  { label: 'Dolci', value: 'dolci' },
  { label: 'Soft Drinks', value: 'soft-drinks' },
  { label: 'Bier', value: 'bier' },
  { label: 'Weißwein', value: 'wein-weiss' },
  { label: 'Rotwein', value: 'wein-rot' },
  { label: 'Roséwein', value: 'wein-rose' },
  { label: 'Prosecco', value: 'prosecco' },
  { label: 'Heiße Getränke', value: 'heisse-getraenke' },
  { label: 'Spirituosen', value: 'spirituosen' },
  { label: 'Cocktails', value: 'cocktails' },
] as const

export const ALLERGENS = [
  { label: 'Gluten', value: 'gluten' },
  { label: 'Laktose', value: 'lactose' },
  { label: 'Nüsse', value: 'nuts' },
  { label: 'Eier', value: 'eggs' },
  { label: 'Fisch', value: 'fish' },
  { label: 'Krustentiere', value: 'shellfish' },
  { label: 'Weichtiere', value: 'mollusks' },
  { label: 'Soja', value: 'soy' },
  { label: 'Senf', value: 'mustard' },
  { label: 'Sulfite', value: 'sulfites' },
  { label: 'Sellerie', value: 'celery' },
  { label: 'Sesam', value: 'sesame' },
  { label: 'Erdnüsse', value: 'peanuts' },
  { label: 'Lupinen', value: 'lupins' },
] as const

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  labels: { singular: 'Speisekarte-Eintrag', plural: 'Speisekarte' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'isSignature', 'updatedAt'],
    group: 'Inhalte',
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'EUR. Wird mit € automatisch formatiert.' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [...MENU_CATEGORIES],
      index: true,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sortierung innerhalb der Kategorie. Niedriger = weiter oben.' },
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'allergens',
      type: 'select',
      hasMany: true,
      options: [...ALLERGENS],
    },
    {
      type: 'row',
      fields: [
        { name: 'isVegetarian', type: 'checkbox', defaultValue: false, label: 'Vegetarisch' },
        { name: 'isVegan', type: 'checkbox', defaultValue: false, label: 'Vegan' },
        { name: 'isSpicy', type: 'checkbox', defaultValue: false, label: 'Scharf' },
      ],
    },
    {
      name: 'isSignature',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Auf der Startseite im Signature-Dishes-Bereich anzeigen.' },
    },
    {
      name: 'availability',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Saisonal', value: 'seasonal' },
        { label: 'Special / Tageskarte', value: 'special' },
      ],
    },
    {
      name: 'winePairing',
      type: 'relationship',
      relationTo: 'menu-items',
      admin: {
        description: 'Optional — empfohlener Wein zu diesem Gericht.',
        condition: (_, siblingData) =>
          ['antipasti', 'pasta', 'schnitzel', 'fisch', 'grill', 'rumpsteak'].includes(
            siblingData?.category as string,
          ),
      },
    },
  ],
}
