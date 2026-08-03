/**
 * Pure guest-frequency stats — no I/O, no Payload imports, unit-testable like
 * availability.ts. Identifies repeat guests ("Stammgäste") from the flat
 * reservation history so staff can prepare a small treat at milestone visits.
 *
 * LIMITATION: identity is a normalized email (or phone as fallback) — there is
 * no cross-linking if the same guest books once by email and once by phone
 * only. Deterministic, no fuzzy/AI matching, by the same policy as the
 * table-assignment algorithm.
 */

export interface GuestReservation {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  partySize: number
  name: string
  email: string
  phone: string
  status: string
}

export interface GuestStat {
  key: string
  name: string
  email: string
  phone: string
  visitCount: number
  lastVisitDate: string
}

export interface UpcomingMilestone {
  reservationId: string
  guestKey: string
  name: string
  date: string
  time: string
  partySize: number
  visitNumber: number
}

export interface GuestStatsResult {
  guests: GuestStat[]
  upcomingMilestones: UpcomingMilestone[]
}

const ACTIVE_STATUSES = (status: string): boolean => status !== 'cancelled' && status !== 'no-show'

// Synthetic placeholders minted for staff-created walk-ins/phone bookings
// without contact details (see src/app/api/manage/reservations/route.ts) —
// must not be treated as a shared guest identity.
const PLACEHOLDER_EMAIL = 'walkin@parpali.local'
const PLACEHOLDER_PHONE = '—'

const MILESTONE_INTERVAL = 5

/** Normalized identity key for a reservation, or null if untrackable (anonymous walk-in). */
function guestKey(r: GuestReservation): string | null {
  const email = r.email.trim().toLowerCase()
  if (email && email !== PLACEHOLDER_EMAIL) return `email:${email}`
  const phone = r.phone.trim()
  if (phone && phone !== PLACEHOLDER_PHONE) return `phone:${phone}`
  return null
}

/**
 * Groups reservations by guest identity, counts non-cancelled/no-show visits,
 * and flags upcoming reservations that land on a 5th/10th/… visit.
 */
export function computeGuestStats(args: {
  reservations: GuestReservation[]
  today: string
}): GuestStatsResult {
  const { reservations, today } = args
  const byGuest = new Map<string, GuestReservation[]>()
  for (const r of reservations) {
    if (!ACTIVE_STATUSES(r.status)) continue
    const key = guestKey(r)
    if (!key) continue
    if (!byGuest.has(key)) byGuest.set(key, [])
    byGuest.get(key)!.push(r)
  }

  const guests: GuestStat[] = []
  const upcomingMilestones: UpcomingMilestone[] = []

  for (const [key, visits] of byGuest) {
    const sorted = [...visits].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    const latest = sorted[sorted.length - 1]
    guests.push({
      key,
      name: latest.name,
      email: latest.email,
      phone: latest.phone,
      visitCount: sorted.length,
      lastVisitDate: latest.date,
    })

    sorted.forEach((r, idx) => {
      const visitNumber = idx + 1
      if (visitNumber % MILESTONE_INTERVAL === 0 && r.date >= today) {
        upcomingMilestones.push({
          reservationId: r.id,
          guestKey: key,
          name: r.name,
          date: r.date,
          time: r.time,
          partySize: r.partySize,
          visitNumber,
        })
      }
    })
  }

  guests.sort((a, b) => b.visitCount - a.visitCount || b.lastVisitDate.localeCompare(a.lastVisitDate))
  upcomingMilestones.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  // First-timers aren't "Stammgäste" yet.
  return { guests: guests.filter((g) => g.visitCount >= 2), upcomingMilestones }
}
