/**
 * Render every booking e-mail template to /tmp as HTML for a visual check —
 * no sending, no DB. Open the printed file paths in a browser.
 *
 *   pnpm tsx scripts/preview-emails.ts
 */
import { writeFileSync } from 'node:fs'
import {
  reservationConfirmationHtml,
  reservationOwnerNotificationHtml,
  reservationReminderHtml,
  reservationCancelledHtml,
} from '../src/lib/email'

process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://parpali-hennef.de'

const guest = { name: 'Maria Rossi', date: '2026-06-12', time: '19:30', partySize: 4 }
const restaurant = { restaurantName: 'Parpali', restaurantPhone: '+49 2242 123456', restaurantEmail: 'reservierung@parpali-hennef.de' }

const files: Record<string, string> = {
  'parpali-email-confirmation.html': reservationConfirmationHtml({
    ...guest, notes: 'Fensterplatz, ein Hochstuhl bitte.', ...restaurant, cancelToken: 'demo-token',
  }),
  'parpali-email-owner.html': reservationOwnerNotificationHtml({
    guestName: guest.name, guestEmail: 'maria@example.com', guestPhone: '+49 170 1234567',
    date: guest.date, time: guest.time, partySize: guest.partySize, notes: 'Fensterplatz', source: 'web', restaurantName: 'Parpali',
  }),
  'parpali-email-reminder.html': reservationReminderHtml({ ...guest, restaurantName: 'Parpali', restaurantPhone: restaurant.restaurantPhone, cancelToken: 'demo-token' }),
  'parpali-email-cancelled.html': reservationCancelledHtml({ name: guest.name, date: guest.date, time: guest.time, restaurantName: 'Parpali' }),
}

for (const [file, html] of Object.entries(files)) {
  const path = `/tmp/${file}`
  writeFileSync(path, html)
  console.log('wrote', path)
}
process.exit(0)
