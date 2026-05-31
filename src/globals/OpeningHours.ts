import type { GlobalConfig } from 'payload'

const WEEKDAYS = [
  { label: 'Montag', value: 1 },
  { label: 'Dienstag', value: 2 },
  { label: 'Mittwoch', value: 3 },
  { label: 'Donnerstag', value: 4 },
  { label: 'Freitag', value: 5 },
  { label: 'Samstag', value: 6 },
  { label: 'Sonntag', value: 0 },
]

export const OpeningHours: GlobalConfig = {
  slug: 'opening-hours',
  label: 'Öffnungszeiten',
  admin: { group: 'Einstellungen' },
  access: { read: () => true },
  fields: [
    { name: 'sectionEyebrow', type: 'text', label: 'Eyebrow (kleine Überzeile)', admin: { description: 'z.B. „Öffnungszeiten" — wird oberhalb der Überschrift angezeigt.' } },
    { name: 'sectionHeading', type: 'text', label: 'Überschrift', admin: { description: 'z.B. „Wann wir für dich kochen"' } },
    {
      name: 'regular',
      type: 'array',
      labels: { singular: 'Wochentag', plural: 'Wochentage' },
      admin: { description: 'Pro Wochentag ein oder mehrere Service-Slots (z.B. Mittag + Abend).' },
      fields: [
        { name: 'weekday', type: 'select', required: true, options: WEEKDAYS.map((w) => ({ label: w.label, value: String(w.value) })) },
        {
          name: 'segments',
          type: 'array',
          labels: { singular: 'Service', plural: 'Services' },
          fields: [
            { name: 'label', type: 'text', defaultValue: 'Abendservice' },
            { name: 'open', type: 'text', required: true, admin: { description: 'HH:mm (24h)' } },
            { name: 'close', type: 'text', required: true, admin: { description: 'HH:mm (24h)' } },
            { name: 'lastSeating', type: 'text', admin: { description: 'Letzte Reservierung HH:mm — z.B. 21:00 unter der Woche, 22:00 am Wochenende. Leer = automatisch (Schluss − Tischbelegung).' } },
          ],
        },
        { name: 'isClosed', type: 'checkbox', defaultValue: false, label: 'Ruhetag' },
      ],
    },
    {
      name: 'holidays',
      type: 'array',
      labels: { singular: 'Feiertag', plural: 'Feiertage' },
      admin: { description: 'Einmalige Schließtage oder abweichende Öffnungszeiten.' },
      fields: [
        { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
        { name: 'label', type: 'text' },
        { name: 'isClosed', type: 'checkbox', defaultValue: true },
        { name: 'openOverride', type: 'text', admin: { description: 'Optional — abweichende Öffnung HH:mm', condition: (_, sibling) => !sibling?.isClosed } },
        { name: 'closeOverride', type: 'text', admin: { description: 'Optional — abweichender Schluss HH:mm', condition: (_, sibling) => !sibling?.isClosed } },
        { name: 'lastSeatingOverride', type: 'text', admin: { description: 'Optional — abweichende letzte Reservierung HH:mm', condition: (_, sibling) => !sibling?.isClosed } },
      ],
    },
  ],
}
