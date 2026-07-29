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
      name: 'maxCombineTables',
      type: 'number',
      required: true,
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: { description: 'Wie viele kombinierbare Tische maximal für eine Gruppe zusammengestellt werden dürfen.' },
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
