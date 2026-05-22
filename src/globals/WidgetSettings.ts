import type { GlobalConfig } from 'payload'

/**
 * Theming for the embeddable booking widget (`/embed/booking`, ADR-0012/0013).
 * Colors are stored as hex strings here — that is config data, not component
 * CSS, so it does not violate the ADR-0005 "no raw hex in *.module.css" rule.
 * The widget injects them as inline CSS custom-property overrides; the CSS
 * Modules still read `var(--token)`. Query params on the embed URL override
 * these per host site.
 */
export const WidgetSettings: GlobalConfig = {
  slug: 'widget-settings',
  label: 'Buchungs-Widget',
  admin: { group: 'Einstellungen' },
  access: { read: () => true },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'restaurantName', type: 'text', required: true, defaultValue: 'Parpali' },
        { name: 'headline', type: 'text', defaultValue: 'Tisch reservieren', admin: { description: 'Überschrift im Widget.' } },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optionales Logo im Widget-Kopf.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'mode', type: 'select', defaultValue: 'light', options: [
          { label: 'Hell', value: 'light' },
          { label: 'Dunkel', value: 'dark' },
        ] },
        {
          name: 'fontFamily',
          type: 'select',
          defaultValue: 'inherit',
          admin: { description: '„Vom Host übernehmen" passt sich der Zielseite an.' },
          options: [
            { label: 'Vom Host übernehmen', value: 'inherit' },
            { label: 'Manrope (Sans)', value: 'manrope' },
            { label: 'Fraunces (Serif)', value: 'fraunces' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'accentColor', type: 'text', admin: { description: 'Akzent-/Button-Farbe als Hex, z.B. #c28b2c. Leer = Standard-Theme.' } },
        { name: 'bgColor', type: 'text', admin: { description: 'Hintergrundfarbe als Hex. Leer = Standard-Theme.' } },
      ],
    },
  ],
}
