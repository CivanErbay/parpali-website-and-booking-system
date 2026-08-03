import type { CollectionBeforeChangeHook } from 'payload'

const TIME_RE = /^\d{2}:\d{2}$/

/**
 * Derives fields that must not be client-supplied:
 *  - `cancelToken` — minted once on create; powers the guest self-cancel link.
 *  - `holdUntil`   — date + time + BookingSettings.tableHoldMinutes, stored as a
 *                    real Date so the dashboard can range-query the day.
 *
 * `holdUntil` is computed by treating the naive date/time strings as UTC — the
 * same convention `src/lib/availability.ts` uses. Every consumer that compares
 * against `holdUntil` must build its bounds the same way.
 */
export const reservationDerivedFields: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (operation === 'create' && !data.cancelToken) {
    data.cancelToken = crypto.randomUUID()
  }

  const dateStr = data.date
    ? String(data.date).slice(0, 10)
    : originalDoc?.date
      ? String(originalDoc.date).slice(0, 10)
      : null
  const time: unknown = data.time ?? originalDoc?.time
  const duration: unknown = data.durationMinutes ?? originalDoc?.durationMinutes

  if (dateStr && typeof time === 'string' && TIME_RE.test(time)) {
    const settings = await req.payload.findGlobal({ slug: 'booking-settings' })
    const holdMin = Number(duration ?? settings?.tableHoldMinutes ?? 120)
    const start = new Date(`${dateStr}T${time}:00.000Z`)
    if (!Number.isNaN(start.getTime())) {
      data.holdUntil = new Date(start.getTime() + holdMin * 60_000).toISOString()
    }
  }

  return data
}
