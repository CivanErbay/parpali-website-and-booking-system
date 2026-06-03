/**
 * Send a REAL booking-confirmation template (full HTML document) via Resend to
 * a recipient, to test deliverability/placement with a representative mail.
 *
 *   RESEND_API_KEY=… RESEND_FROM_EMAIL="Parpali <reservierung@parpali-hennef.de>" \
 *   NEXT_PUBLIC_SITE_URL=https://parpali-hennef.de \
 *   pnpm exec tsx scripts/send-test-email.ts empfaenger@example.com
 */
import { reservationConfirmationHtml, sendEmail } from '../src/lib/email'

async function main() {
  const to = process.argv[2]
  if (!to) {
    console.error('Empfänger-Adresse als Argument angeben.')
    process.exit(1)
  }
  await sendEmail({
    to,
    subject: 'Reservierung bestätigt — Parpali · 12.06. um 19:30 Uhr',
    html: reservationConfirmationHtml({
      name: 'Maria Rossi',
      date: '2026-06-12',
      time: '19:30',
      partySize: 4,
      notes: 'Fensterplatz, ein Hochstuhl bitte.',
      restaurantName: 'Parpali',
      restaurantPhone: '+49 2242 123456',
      restaurantEmail: 'reservierung@parpali-hennef.de',
      restaurantAddress: 'Marktpl. 5, 53773 Hennef (Sieg)',
      cancelToken: 'demo-token',
    }),
  })
  console.log('gesendet an', to)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
