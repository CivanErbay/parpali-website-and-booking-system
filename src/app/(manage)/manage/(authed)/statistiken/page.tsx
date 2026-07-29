import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { mapGuestReservations } from '@/lib/bookingContext'
import { computeGuestStats } from '@/lib/guestStats'
import { isoToday, formatShortDate } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function StatistikenPage() {
  const payload = await getPayload({ config })
  const resvResp = await payload.find({
    collection: 'reservations',
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  const today = isoToday()
  const { guests, upcomingMilestones } = computeGuestStats({
    reservations: mapGuestReservations(resvResp.docs),
    today,
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Statistiken</p>
          <h1 className={styles.title}>Stammgäste</h1>
          <p className={styles.subtitle}>{guests.length} Stammgäste mit 2+ Besuchen</p>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Anstehende Meilenstein-Besuche</h2>
        {upcomingMilestones.length === 0 ? (
          <p className={styles.empty}>Aktuell keine anstehende Reservierung, die ein Vielfaches von 5 Besuchen erreicht.</p>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Zeit</th>
                  <th>Gast</th>
                  <th>Pers.</th>
                  <th>Besuch</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMilestones.map((m) => (
                  <tr key={m.reservationId}>
                    <td>{formatShortDate(m.date)}</td>
                    <td>{m.time}</td>
                    <td>{m.name}</td>
                    <td>{m.partySize}</td>
                    <td>🎉 {m.visitNumber}. Besuch</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Alle Stammgäste</h2>
        {guests.length === 0 ? (
          <p className={styles.empty}>Noch keine Gäste mit mehrfachen Besuchen.</p>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Telefon</th>
                  <th>Besuche</th>
                  <th>Letzter Besuch</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.key}>
                    <td>{g.name}</td>
                    <td>{g.email}</td>
                    <td>{g.phone || '—'}</td>
                    <td>{g.visitCount}{g.visitCount % 5 === 0 ? ' 🎉' : ''}</td>
                    <td>{formatShortDate(g.lastVisitDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
