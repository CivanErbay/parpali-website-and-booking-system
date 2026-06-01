import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { TablesManager, type TableRow } from '@/components/Manage/ConfigForms/TablesManager'

export const dynamic = 'force-dynamic'

const relIds = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .map((x) =>
          typeof x === 'string'
            ? x
            : x && typeof x === 'object' && 'id' in x
              ? String((x as { id: unknown }).id)
              : '',
        )
        .filter(Boolean)
    : []

export default async function TablesPage() {
  const payload = await getPayload({ config })
  const resp = await payload.find({
    collection: 'tables',
    limit: 200,
    depth: 0,
    sort: 'sortOrder',
    overrideAccess: true,
  })

  const initial: TableRow[] = resp.docs.map((t) => ({
    id: String(t.id),
    label: String(t.label ?? ''),
    capacity: Number(t.capacity ?? 2),
    zone: String(t.zone ?? 'main'),
    sortOrder: Number(t.sortOrder ?? 0),
    combinable: Boolean(t.combinable),
    active: Boolean(t.active),
    combinesWith: relIds(t.combinesWith),
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
    </div>
  )
}
