import { describe, it, expect } from 'vitest'
import { computeGuestStats, type GuestReservation } from './guestStats'

const r = (over: Partial<GuestReservation> = {}): GuestReservation => ({
  id: 'r1',
  date: '2026-06-01',
  time: '18:00',
  partySize: 2,
  name: 'Anna Muster',
  email: 'anna@example.com',
  phone: '0221123456',
  status: 'confirmed',
  ...over,
})

describe('computeGuestStats', () => {
  it('groups repeat visits by normalized email', () => {
    const reservations = [
      r({ id: 'a', date: '2026-05-01', email: 'Anna@Example.com ' }),
      r({ id: 'b', date: '2026-06-01', email: ' anna@example.com' }),
    ]
    const { guests } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(guests).toHaveLength(1)
    expect(guests[0].visitCount).toBe(2)
    expect(guests[0].lastVisitDate).toBe('2026-06-01')
  })

  it('excludes first-time guests (visitCount 1)', () => {
    const reservations = [r({ id: 'a' })]
    const { guests } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(guests).toHaveLength(0)
  })

  it('ignores cancelled and no-show reservations when counting visits', () => {
    const reservations = [
      r({ id: 'a', date: '2026-01-01' }),
      r({ id: 'b', date: '2026-02-01' }),
      r({ id: 'c', date: '2026-03-01', status: 'cancelled' }),
      r({ id: 'd', date: '2026-04-01', status: 'no-show' }),
    ]
    const { guests } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(guests[0].visitCount).toBe(2)
  })

  it('does not group anonymous walk-ins sharing the placeholder email/phone', () => {
    const reservations = [
      r({ id: 'a', name: 'Walk-in 1', email: 'walkin@parpali.local', phone: '—' }),
      r({ id: 'b', name: 'Walk-in 2', email: 'walkin@parpali.local', phone: '—' }),
    ]
    const { guests } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(guests).toHaveLength(0)
  })

  it('falls back to phone identity when email is the walk-in placeholder', () => {
    const reservations = [
      r({ id: 'a', date: '2026-01-01', email: 'walkin@parpali.local', phone: '0221999999' }),
      r({ id: 'b', date: '2026-02-01', email: 'walkin@parpali.local', phone: '0221999999' }),
    ]
    const { guests } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(guests).toHaveLength(1)
    expect(guests[0].visitCount).toBe(2)
  })

  it('flags an upcoming reservation that lands on the 5th visit', () => {
    const reservations = [
      r({ id: '1', date: '2026-01-01' }),
      r({ id: '2', date: '2026-02-01' }),
      r({ id: '3', date: '2026-03-01' }),
      r({ id: '4', date: '2026-04-01' }),
      r({ id: '5', date: '2026-08-01' }), // future relative to `today`
    ]
    const { upcomingMilestones } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(upcomingMilestones).toHaveLength(1)
    expect(upcomingMilestones[0]).toMatchObject({ reservationId: '5', visitNumber: 5 })
  })

  it('does not flag a past visit even if it was the 5th', () => {
    const reservations = Array.from({ length: 5 }, (_, i) =>
      r({ id: String(i), date: `2026-0${i + 1}-01` }),
    )
    const { upcomingMilestones } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(upcomingMilestones).toHaveLength(0)
  })

  it('sorts guests by visit count descending', () => {
    const reservations = [
      r({ id: '1', date: '2026-01-01', email: 'a@example.com' }),
      r({ id: '2', date: '2026-02-01', email: 'a@example.com' }),
      r({ id: '3', date: '2026-01-01', email: 'b@example.com' }),
      r({ id: '4', date: '2026-02-01', email: 'b@example.com' }),
      r({ id: '5', date: '2026-03-01', email: 'b@example.com' }),
    ]
    const { guests } = computeGuestStats({ reservations, today: '2026-07-01' })
    expect(guests[0].email).toBe('b@example.com')
    expect(guests[0].visitCount).toBe(3)
    expect(guests[1].email).toBe('a@example.com')
  })
})
