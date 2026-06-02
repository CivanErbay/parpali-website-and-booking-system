import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { getOpenSlots } from '../../../lib/availability'
import {
  mapPolicy,
  mapOpeningRules,
  mapHolidays,
  mapBlackouts,
  mapTables,
  mapReservations,
} from '../../../lib/bookingContext'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url)
  const date = url.searchParams.get('date')
  const partySizeParam = url.searchParams.get('partySize')

  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Ungültiges oder fehlendes Datum.' }, { status: 400 })
  }
  const partySize = Number(partySizeParam)
  if (!Number.isInteger(partySize) || partySize < 1) {
    return NextResponse.json({ error: 'Ungültige oder fehlende Personenzahl.' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  const [settings, hours, tablesResp, existingResp] = await Promise.all([
    payload.findGlobal({ slug: 'booking-settings' }),
    payload.findGlobal({ slug: 'opening-hours' }),
    payload.find({
      collection: 'tables',
      where: { active: { equals: true } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'reservations',
      where: { date: { equals: date } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const policy = mapPolicy(settings)
  const slots = getOpenSlots({
    date,
    now: new Date(),
    policy,
    openingRules: mapOpeningRules(hours),
    holidayOverrides: mapHolidays(hours),
    blackoutDates: mapBlackouts(settings),
    partySize,
    tables: mapTables(tablesResp.docs),
    existing: mapReservations(existingResp.docs),
  })

  // Public response: only the bookable times are needed by the form. The
  // internal best-fit assignment is not leaked to the client.
  return NextResponse.json({
    slots: slots.map((s) => ({ time: s.time })),
    policy: { maxPartyOnline: policy.maxPartyOnline, minLeadTimeHours: policy.minLeadTimeHours },
  })
}
