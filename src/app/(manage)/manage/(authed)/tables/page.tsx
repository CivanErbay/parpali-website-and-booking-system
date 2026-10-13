import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { TablesManager, type TableRow } from '@/components/Manage/ConfigForms/TablesManager'
import { TableCombosManager } from '@/components/Manage/ConfigForms/TableCombosManager'
import { mapTableCombos } from '@/lib/bookingContext'

export const dynamic = 'force-dynamic'

export default async function TablesPage() {
  const payload = await getPayload({ config })
  const resp = await payload.find({
    collection: 'tables',
    limit: 200,
    depth: 0,
    sort: 'sortOrder',
    overrideAccess: true,
  })
  const settings = await payload.findGlobal({ slug: 'booking-settings', depth: 0, overrideAccess: true })

  const initial: TableRow[] = resp.docs.map((t) => ({
    id: String(t.id),
    label: String(t.label ?? ''),
    capacity: Number(t.capacity ?? 2),
    zone: String(t.zone ?? 'main'),
    sortOrder: Number(t.sortOrder ?? 0),
    active: Boolean(t.active),
  }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Konfiguration</p>
          <h1 className={styles.title}>Tische</h1>
          <p className={styles.subtitle}>Plätze, Bereich und Verfügbarkeit eurer Tische verwalten.</p>
        </div>
      </header>
      <TablesManager initial={initial} />
      <TableCombosManager
        tables={initial.map((t) => ({ id: t.id, label: t.label }))}
        initial={mapTableCombos(settings.tableCombos).map((c) => ({
          tableIds: c.tableIds,
          minParty: c.minParty ?? null,
          maxParty: c.maxParty,
        }))}
      />
    </div>
  )
}
