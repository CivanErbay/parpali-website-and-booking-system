import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { mapPolicy } from '@/lib/bookingContext'
import { EmbedSnippet } from '@/components/Manage/EmbedSnippet/EmbedSnippet'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parpali.de').replace(/\/$/, '')

const EMBED_SNIPPET = `<iframe id="parpali-booking" src="${SITE_URL}/embed/booking"
        style="width:100%;border:0;" scrolling="no"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'parpali-widget-resize') {
      var f = document.getElementById('parpali-booking')
      if (f) f.style.height = e.data.height + 'px'
    }
  })
</script>`

export const dynamic = 'force-dynamic'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.dlRow}>
      <dt className={styles.dlKey}>{label}</dt>
      <dd className={styles.dlVal}>{value}</dd>
    </div>
  )
}

export default async function SettingsPage() {
  const payload = await getPayload({ config })
  const [bookingDoc, widget] = await Promise.all([
    payload.findGlobal({ slug: 'booking-settings' }),
    payload.findGlobal({ slug: 'widget-settings' }),
  ])
  const policy = mapPolicy(bookingDoc)
  const blackouts = Array.isArray((bookingDoc as { blackoutDates?: unknown[] }).blackoutDates)
    ? (bookingDoc as { blackoutDates: unknown[] }).blackoutDates.length
    : 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Konfiguration</p>
          <h1 className={styles.title}>Einstellungen</h1>
          <p className={styles.subtitle}>Buchungsregeln und Widget-Erscheinungsbild.</p>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reservierungs-Regeln</h2>
        <div className={styles.adminNote}>
          <span>Buchungsregeln bearbeiten:</span>
          <a className={styles.ghostBtn} href="/admin/globals/booking-settings" target="_blank" rel="noreferrer">
            Im Admin bearbeiten
          </a>
        </div>
        <div className={styles.card}>
          <dl className={styles.dl}>
            <Row label="Reservier-Raster" value={`${policy.slotMinutes} Min`} />
            <Row label="Tisch-Haltezeit" value={`${policy.tableHoldMinutes} Min`} />
            <Row label="Mindest-Vorlaufzeit" value={`${policy.minLeadTimeHours} Std`} />
            <Row label="Max. Gruppe online" value={`${policy.maxPartyOnline} Personen`} />
            <Row label="Buchbar im Voraus" value={`${policy.advanceWindowDays} Tage`} />
            <Row label="Max. kombinierte Tische" value={`${policy.maxCombineTables}`} />
            <Row label="Gäste-Obergrenze pro Slot" value={`${policy.maxSeatsPerSlot}`} />
            <Row label="Blackout-Tage" value={`${blackouts}`} />
          </dl>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buchungs-Widget</h2>
        <div className={styles.adminNote}>
          <span>Widget-Logo, Farben und Schrift bearbeiten:</span>
          <a className={styles.ghostBtn} href="/admin/globals/widget-settings" target="_blank" rel="noreferrer">
            Im Admin bearbeiten
          </a>
        </div>
        <div className={styles.card}>
          <dl className={styles.dl}>
            <Row label="Restaurantname" value={String((widget as { restaurantName?: string }).restaurantName ?? '—')} />
            <Row label="Überschrift" value={String((widget as { headline?: string }).headline ?? '—')} />
            <Row label="Modus" value={(widget as { mode?: string }).mode === 'dark' ? 'Dunkel' : 'Hell'} />
            <Row label="Schrift" value={String((widget as { fontFamily?: string }).fontFamily ?? 'inherit')} />
            <Row label="Akzentfarbe" value={String((widget as { accentColor?: string }).accentColor || 'Standard')} />
            <Row label="Hintergrund" value={String((widget as { bgColor?: string }).bgColor || 'Standard')} />
          </dl>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Widget einbetten</h2>
        <p className={styles.subtitle}>
          Diesen Code auf der Ziel-Website einfügen — das iframe passt seine Höhe automatisch an.
        </p>
        <EmbedSnippet snippet={EMBED_SNIPPET} />
      </section>
    </div>
  )
}
