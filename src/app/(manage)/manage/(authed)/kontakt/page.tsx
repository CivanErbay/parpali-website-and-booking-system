import { getPayload } from 'payload'
import config from '@payload-config'
import styles from '../manage.module.css'
import { ContactInfoForm, type ContactValues } from '@/components/Manage/ConfigForms/ContactInfoForm'

export const dynamic = 'force-dynamic'

const rec = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export default async function KontaktPage() {
  const payload = await getPayload({ config })
  const doc = rec(await payload.findGlobal({ slug: 'contact-info' }))
  const maps = rec(doc.maps)

  const initial: ContactValues = {
    restaurantName: str(doc.restaurantName),
    street: str(doc.street),
    zip: str(doc.zip),
    city: str(doc.city),
    phone: str(doc.phone),
    email: str(doc.email),
    whatsapp: str(doc.whatsapp),
    ownerName: str(doc.ownerName),
    vatId: str(doc.vatId),
    maps: { directionsUrl: str(maps.directionsUrl), embedUrl: str(maps.embedUrl) },
    social: (Array.isArray(doc.social) ? doc.social : [])
      .map(rec)
      .map((s) => ({ platform: str(s.platform), url: str(s.url) }))
      .filter((s) => s.platform || s.url),
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headMain}>
          <p className={styles.eyebrow}>Konfiguration</p>
          <h1 className={styles.title}>Kontakt</h1>
          <p className={styles.subtitle}>Adresse, Telefon, E-Mail und Social-Links pflegen.</p>
        </div>
      </header>
      <ContactInfoForm initial={initial} />
    </div>
  )
}
