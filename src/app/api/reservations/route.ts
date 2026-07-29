import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import {
  getOpenSlots,
  assignTableForBooking,
  occupiedTableIds,
  toBlockMinutes,
} from '../../../lib/availability'
import {
  mapPolicy,
  mapOpeningRules,
  mapHolidays,
  mapBlackouts,
  mapTables,
  mapReservations,
} from '../../../lib/bookingContext'
import { reservationConfirmationHtml, reservationOwnerNotificationHtml, sendEmail } from '../../../lib/email'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ReservationPayload {
  date: string
  time: string
  partySize: number
  name: string
  email: string
  phone: string
  notes?: string
  durationMinutes?: number
}

function validate(body: unknown): { ok: true; data: ReservationPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Ungültige Anfrage.' }
  const b = body as Record<string, unknown>
  if (typeof b.date !== 'string' || !DATE_RE.test(b.date)) return { ok: false, error: 'Ungültiges Datum.' }
  if (typeof b.time !== 'string' || !TIME_RE.test(b.time)) return { ok: false, error: 'Ungültige Uhrzeit.' }
  const partySize = Number(b.partySize)
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 30) return { ok: false, error: 'Ungültige Personenzahl.' }
  if (typeof b.name !== 'string' || b.name.trim().length < 2) return { ok: false, error: 'Bitte gib deinen Namen an.' }
  if (typeof b.email !== 'string' || !EMAIL_RE.test(b.email)) return { ok: false, error: 'Bitte gib eine gültige E-Mail-Adresse an.' }
  // Telefon ist optional.
  const phone = typeof b.phone === 'string' ? b.phone.trim() : ''
  const durationMinutes = b.durationMinutes != null ? Number(b.durationMinutes) : undefined
  if (durationMinutes != null && (!Number.isFinite(durationMinutes) || durationMinutes < 1)) {
    return { ok: false, error: 'Ungültige Aufenthaltsdauer.' }
  }
  return {
    ok: true,
    data: {
      date: b.date,
      time: b.time,
      partySize,
      name: b.name.trim(),
      email: b.email.trim(),
      phone,
      notes: typeof b.notes === 'string' ? b.notes.trim() : undefined,
      durationMinutes,
    },
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  const v = validate(body)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
  const data = v.data

  const payload = await getPayload({ config })

  const [settings, hours, tablesResp, existingResp, contact] = await Promise.all([
    payload.findGlobal({ slug: 'booking-settings' }),
    payload.findGlobal({ slug: 'opening-hours' }),
    payload.find({ collection: 'tables', where: { active: { equals: true } }, limit: 200, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'reservations', where: { date: { equals: data.date } }, limit: 500, depth: 0, overrideAccess: true }),
    payload.findGlobal({ slug: 'contact-info' }),
  ])

  const policy = mapPolicy(settings)

  if (data.partySize > policy.maxPartyOnline) {
    return NextResponse.json(
      { error: `Online-Buchungen für maximal ${policy.maxPartyOnline} Personen — größere Gruppen bitte telefonisch anfragen.` },
      { status: 400 },
    )
  }

  const tables = mapTables(tablesResp.docs)
  const existing = mapReservations(existingResp.docs)

  const stayMinutes = data.durationMinutes
    ? Math.min(Math.max(data.durationMinutes, policy.tableHoldMinutes), policy.maxStayMinutes)
    : policy.tableHoldMinutes

  const openSlots = getOpenSlots({
    date: data.date,
    now: new Date(),
    policy,
    openingRules: mapOpeningRules(hours),
    holidayOverrides: mapHolidays(hours),
    blackoutDates: mapBlackouts(settings),
    partySize: data.partySize,
    tables,
    existing,
    stayMinutes,
  })

  if (!openSlots.find((s) => s.time === data.time)) {
    return NextResponse.json({ error: 'Dieser Zeitslot ist nicht mehr verfügbar.' }, { status: 409 })
  }

  const assignment = assignTableForBooking({
    date: data.date,
    time: data.time,
    partySize: data.partySize,
    policy,
    tables,
    existing,
    stayMinutes,
  })
  if (!assignment.ok) {
    return NextResponse.json(
      { error: 'Dieser Zeitslot ist nicht mehr verfügbar.' },
      { status: 409 },
    )
  }

  const created = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    depth: 0,
    data: {
      date: data.date,
      time: data.time,
      partySize: data.partySize,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      durationMinutes: stayMinutes,
      assignedTables: assignment.option.tableIds,
      assignmentMode: 'auto',
      status: 'pending',
      source: 'web',
    },
  })

  // Concurrency guard: re-read the day and yield to any reservation created
  // before ours that now shares one of our tables (ADR-0012).
  let assignedTableIds = assignment.option.tableIds
  try {
    const fresh = await payload.find({
      collection: 'reservations',
      where: { date: { equals: data.date } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })
    const ourCreatedAt = new Date(String(created.createdAt)).getTime()
    const priorDocs = fresh.docs.filter(
      (d) =>
        String(d.id) !== String(created.id) &&
        new Date(String(d.createdAt)).getTime() < ourCreatedAt,
    )
    const prior = mapReservations(priorDocs)
    const occ = occupiedTableIds({
      date: data.date,
      blockStartMin: toBlockMinutes(data.time),
      policy,
      existing: prior,
      candidateDurationMinutes: stayMinutes,
    })
    if (assignedTableIds.some((id) => occ.has(id))) {
      const reassign = assignTableForBooking({
        date: data.date,
        time: data.time,
        partySize: data.partySize,
        policy,
        tables,
        existing: prior,
        stayMinutes,
      })
      if (reassign.ok) {
        assignedTableIds = reassign.option.tableIds
        await payload.update({
          collection: 'reservations',
          id: created.id,
          overrideAccess: true,
          data: { assignedTables: assignedTableIds },
        })
      } else {
        await payload.update({
          collection: 'reservations',
          id: created.id,
          overrideAccess: true,
          data: { status: 'cancelled' },
        })
        return NextResponse.json(
          { error: 'Dieser Zeitslot wurde soeben vergeben. Bitte wähle eine andere Zeit.' },
          { status: 409 },
        )
      }
    }
  } catch (err) {
    console.error('[reservations] concurrency guard failed (booking kept):', err)
  }

  const restaurantName = String(contact?.restaurantName ?? 'Parpali')
  const restaurantPhone = String(contact?.phone ?? '')
  const restaurantEmail = String(contact?.email ?? '')
  const restaurantAddress = [
    String(contact?.street ?? ''),
    [String(contact?.zip ?? ''), String(contact?.city ?? '')].filter((s) => s.trim()).join(' '),
  ]
    .filter((s) => s.trim())
    .join(', ')
  const cancelToken = String(created.cancelToken ?? '')

  try {
    await sendEmail({
      to: data.email,
      subject: `Reservierung bestätigt — ${restaurantName} · ${data.date} um ${data.time} Uhr`,
      html: reservationConfirmationHtml({
        name: data.name,
        date: data.date,
        time: data.time,
        partySize: data.partySize,
        notes: data.notes,
        restaurantName,
        restaurantPhone,
        restaurantEmail,
        restaurantAddress,
        cancelToken,
      }),
      // No Reply-To: From is already the custom-domain address. A freemail
      // Reply-To (the contact's web.de/gmail) triggers FREEMAIL_FORGED_REPLYTO
      // in spam filters (+2.5). Guest replies go to reservierung@ (forward it).
    })
    if (restaurantEmail) {
      await sendEmail({
        to: restaurantEmail,
        subject: `Neue Reservierung — ${data.name} · ${data.date} ${data.time} · ${data.partySize}P`,
        html: reservationOwnerNotificationHtml({
          guestName: data.name,
          guestEmail: data.email,
          guestPhone: data.phone,
          date: data.date,
          time: data.time,
          partySize: data.partySize,
          notes: data.notes,
          source: 'web',
          restaurantName,
        }),
        // No freemail Reply-To (would spam-flag this notification too). The
        // guest's e-mail is a tappable link in the body instead.
      })
    }
  } catch (err) {
    console.error('[reservations] email send failed (booking still saved):', err)
  }

  return NextResponse.json({ id: created.id, status: 'pending' }, { status: 201 })
}
