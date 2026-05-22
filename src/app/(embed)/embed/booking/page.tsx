export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { BookingForm } from '@/components/BookingForm/BookingForm'
import { WidgetFrame } from '@/components/Widget/WidgetFrame/WidgetFrame'
import { mapPolicy } from '@/lib/bookingContext'

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/
const pickHex = (v: unknown): string | undefined =>
  typeof v === 'string' && HEX_RE.test(v) ? v : undefined

/**
 * Embeddable booking widget. Theme comes from the WidgetSettings global, with
 * per-host overrides via ?accent= / ?bg= / ?mode= query params (validated as
 * hex). Values are injected as inline CSS custom-property overrides — the
 * BookingForm CSS reads var(--token), so no raw colors enter component CSS.
 */
export default async function EmbedBookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const str = (v: string | string[] | undefined): string | undefined =>
    typeof v === 'string' ? v : undefined

  const payload = await getPayload({ config })
  const [widget, settings, contact] = await Promise.all([
    payload.findGlobal({ slug: 'widget-settings' }),
    payload.findGlobal({ slug: 'booking-settings' }),
    payload.findGlobal({ slug: 'contact-info' }),
  ])
  const policy = mapPolicy(settings)

  const modeParam = str(sp.mode)
  const mode: 'light' | 'dark' =
    modeParam === 'dark' || modeParam === 'light'
      ? modeParam
      : widget.mode === 'dark'
        ? 'dark'
        : 'light'

  const accent = pickHex(str(sp.accent)) ?? pickHex(widget.accentColor)
  const bg = pickHex(str(sp.bg)) ?? pickHex(widget.bgColor)
  const themeVars: Record<string, string> = {}
  if (accent) {
    themeVars['--accent'] = accent
    themeVars['--accent-hover'] = accent
    themeVars['--focus-ring'] = accent
  }
  if (bg) themeVars['--bg'] = bg

  const logo = widget.logo
  const logoUrl =
    logo && typeof logo === 'object' && 'url' in logo && logo.url ? String(logo.url) : undefined

  return (
    <WidgetFrame
      mode={mode}
      themeVars={themeVars}
      restaurantName={String(widget.restaurantName ?? 'Parpali')}
      headline={String(widget.headline ?? 'Tisch reservieren')}
      logoUrl={logoUrl}
    >
      <BookingForm phone={String(contact?.phone ?? '')} maxPartyOnline={policy.maxPartyOnline} />
    </WidgetFrame>
  )
}
