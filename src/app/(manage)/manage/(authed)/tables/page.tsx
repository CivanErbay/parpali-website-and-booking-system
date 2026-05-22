import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'

export const dynamic = 'force-dynamic'

const ZONE_LABELS: Record<string, string> = {
  main: 'Hauptraum',
  terrace: 'Terrasse',
  bar: 'Bar',
  private: 'Nebenraum',
}

export default async function TablesPage() {
  const payload = await getPayload({ config })
  const resp = await payload.find({
    collection: 'tables',
    limit: 200,
    depth: 0,
    sort: 'sortOrder',
    overrideAccess: true,
  })
  const tables = resp.docs
  const active = tables.filter((t) => t.active)
  const totalSeats = active.reduce((s, t) => s + Number(t.capacity ?? 0), 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Konfiguration</p>
          <h1 className={styles.title}>Tische</h1>
          <p className={styles.subtitle}>
            {active.length} aktive Tische · {totalSeats} Plätze gesamt
          </p>
        </div>
      </header>

      <div className={styles.adminNote}>
        <span>Tische anlegen, bearbeiten oder Nachbarschaften für Kombinationen pflegen:</span>
        <a className={styles.ghostBtn} href="/admin/collections/tables" target="_blank" rel="noreferrer">
          Im Admin bearbeiten
        </a>
      </div>

      {tables.length === 0 ? (
        <p className={styles.empty}>Noch keine Tische angelegt.</p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Tisch</th>
                <th>Plätze</th>
                <th>Bereich</th>
                <th>Kombinierbar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.id}>
                  <td>{t.label}</td>
                  <td>{t.capacity}</td>
                  <td>{ZONE_LABELS[String(t.zone)] ?? t.zone}</td>
                  <td>
                    {t.combinable
                      ? `Ja (${Array.isArray(t.combinesWith) ? t.combinesWith.length : 0} Nachbarn)`
                      : 'Nein'}
                  </td>
                  <td>
                    <span className={t.active ? `${styles.tag} ${styles.tagOn}` : `${styles.tag} ${styles.tagOff}`}>
                      {t.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
