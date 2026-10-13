import type { GlobalConfig } from 'payload'

export const BookingSettings: GlobalConfig = {
  slug: 'booking-settings',
  label: 'Reservierung-Einstellungen',
  admin: { group: 'Einstellungen' },
  access: { read: () => true },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'slotMinutes',
          type: 'number',
          required: true,
          defaultValue: 30,
          min: 5,
          max: 60,
          admin: { description: 'Reservier-Raster in Minuten (z.B. 30 = Zeiten alle 30 Min).' },
        },
        {
          name: 'maxSeatsPerSlot',
          type: 'number',
          required: true,
          defaultValue: 200,
          min: 1,
          admin: { description: 'Weiche Obergrenze: max. Gäste, die pro Slot starten dürfen (Küchen-Taktung). Physische Kapazität ergibt sich aus den Tischen — hoch setzen, um diese Grenze zu deaktivieren.' },
        },
        {
          name: 'tableHoldMinutes',
          type: 'number',
          required: true,
          defaultValue: 120,
          min: 15,
          admin: { description: 'Minimale & standardmäßige Aufenthaltsdauer in Minuten (Standard 120 = 2 Std.). Gäste können online bis zu "Maximale Aufenthaltsdauer" verlängern.' },
        },
        {
          name: 'maxStayMinutes',
          type: 'number',
          required: true,
          defaultValue: 300,
          min: 120,
          max: 480,
          admin: { description: 'Maximale Aufenthaltsdauer in Minuten, wenn ein Gast online "länger bleiben" wählt (Standard 300 = 5 Std.). Abends automatisch eingeschränkt, wenn es vor Schließung nicht mehr passt.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'maxPartyOnline', type: 'number', required: true, defaultValue: 8, min: 1, admin: { description: 'Größere Gruppen müssen telefonisch anfragen.' } },
        { name: 'minLeadTimeHours', type: 'number', required: true, defaultValue: 2, min: 0, admin: { description: 'Mindest-Vorlaufzeit für Online-Buchungen.' } },
        { name: 'advanceWindowDays', type: 'number', required: true, defaultValue: 60, min: 1, admin: { description: 'Wie weit im Voraus gebucht werden kann.' } },
      ],
    },
    {
      name: 'tableCombos',
      type: 'array',
      label: 'Tisch-Kombinationen',
      admin: {
        description:
          'Nur diese Tisch-Kombinationen darf das System für größere Gruppen zusammenstellen — mit eigener Personenzahl (z. B. Tisch 1 + 2 = 4 Personen).',
      },
      fields: [
        { name: 'tables', type: 'relationship', relationTo: 'tables', hasMany: true, required: true, minRows: 2, label: 'Tische' },
        {
          type: 'row',
          fields: [
            { name: 'minParty', type: 'number', min: 1, max: 40, label: 'Ab Personen', admin: { description: 'Optional — kleinere Gruppen bekommen diese Kombination nicht.' } },
            { name: 'maxParty', type: 'number', required: true, min: 1, max: 40, label: 'Bis Personen' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'emergencyStop',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Notknopf: sofort ALLE Online-Reservierungen stoppen. Wird im Dashboard über den Notknopf-Button gesteuert, nicht hier direkt.',
          },
        },
        {
          name: 'emergencyStopMessage',
          type: 'text',
          admin: {
            description: 'Hinweistext für Gäste, solange der Notknopf aktiv ist (leer = Standardtext).',
            condition: (data) => Boolean(data?.emergencyStop),
          },
        },
      ],
    },
    {
      name: 'blackoutDates',
      type: 'array',
      labels: { singular: 'Blackout-Tag', plural: 'Blackout-Tage' },
      admin: { description: 'Tage, an denen keine Online-Buchung möglich ist (z.B. Privatveranstaltung).' },
      fields: [
        { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
        { name: 'reason', type: 'text' },
      ],
    },
    {
      name: 'confirmationCopy',
      type: 'group',
      label: 'Bestätigungstexte',
      fields: [
        { name: 'thanks', type: 'textarea', defaultValue: 'Vielen Dank für deine Reservierung. Wir freuen uns auf deinen Besuch.', localized: true },
        { name: 'house', type: 'textarea', defaultValue: 'Bitte sag uns kurz Bescheid, falls du dich verspätest oder nicht kommen kannst.', localized: true },
      ],
    },
  ],
}
