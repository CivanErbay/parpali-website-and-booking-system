import { NextResponse } from 'next/server'
import { withUser } from '@/lib/manageAuth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'tripadvisor', 'google'] as const
type Platform = (typeof PLATFORMS)[number]

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** POST /api/manage/contact — update the contact-info global. */
export async function POST(req: Request): Promise<NextResponse> {
  return withUser(req, async ({ payload }) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }
    const b = (body ?? {}) as Record<string, unknown>

    const restaurantName = str(b.restaurantName)
    const street = str(b.street)
    const zip = str(b.zip)
    const city = str(b.city)
    const phone = str(b.phone)
    const email = str(b.email)

    if (!restaurantName) return NextResponse.json({ error: 'Name des Restaurants ist erforderlich.' }, { status: 400 })
    if (!street || !zip || !city) return NextResponse.json({ error: 'Vollständige Adresse ist erforderlich.' }, { status: 400 })
    if (!phone) return NextResponse.json({ error: 'Telefonnummer ist erforderlich.' }, { status: 400 })
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })

    const maps = (b.maps ?? {}) as Record<string, unknown>
    const social = (Array.isArray(b.social) ? b.social : [])
      .map((x) => (x ?? {}) as Record<string, unknown>)
      .map((x) => ({ platform: str(x.platform), url: str(x.url) }))
      .filter((x): x is { platform: Platform; url: string } => x.url !== '' && (PLATFORMS as readonly string[]).includes(x.platform))

    try {
      await payload.updateGlobal({
        slug: 'contact-info',
        overrideAccess: true,
        data: {
          restaurantName,
          street,
          zip,
          city,
          phone,
          email,
          whatsapp: str(b.whatsapp),
          ownerName: str(b.ownerName),
          vatId: str(b.vatId),
          maps: { directionsUrl: str(maps.directionsUrl), embedUrl: str(maps.embedUrl) },
          social,
        },
      })
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('[manage/contact] save failed:', err)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 400 })
    }
  })
}
