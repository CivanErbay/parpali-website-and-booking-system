# ADR-0012: Per-Table Reservation Model Replaces the Seat Pool

## Status
Proposed (2026-05-22)

## Context
The booking system shipped with a deliberately simple capacity model: `BookingSettings.maxSeatsPerSlot` is a single shared pool of seats, and `availability.ts` checks whether a slot has enough seats left for a party. There are no physical tables — a party of 2 and a party of 6 both just subtract from one number.

Parpali needs real tables. Tables have fixed capacities (2-tops, 4-tops, 6-tops), some can be pushed together for larger parties and some cannot, and the owner needs to see *which table* a reservation sits at. A seat pool cannot express "we have eleven free seats but no single table fits a party of 4," nor can it drive a per-table dashboard timeline. It also silently overbooks: 15 free seats spread across 2-tops will happily accept a party of 5.

The reservation hold is also changing: a booked table is blocked for 2.5 h, up from the inherited 90-minute default. And the system must assign a table at booking time so the owner gets a usable seating plan rather than an unallocated list.

## Decision
We introduce a `Tables` collection (label, capacity, zone, `combinable` flag, explicit `combinesWith` self-relationship, `active`, `sortOrder`) and rewrite `availability.ts` from seat-pool arithmetic to per-table allocation. A slot is open for a party iff at least one single table fits, or a connected group of combinable tables (bounded by `BookingSettings.maxCombineTables`, default 3) fits. Table assignment is a deterministic best-fit: smallest waste, then fewest tables, then lowest summed `sortOrder`, then lexicographic — no AI. The owner can override any assignment from the dashboard.

`Reservations` gains `assignedTables` (relationship, `hasMany`), `holdUntil` (derived `Date`, for range queries), `assignmentMode` (`auto`|`manual`) and `cancelToken` (for guest self-cancellation). `tableHoldMinutes` default moves to 150. `maxSeatsPerSlot` is **kept and repurposed** as an optional soft per-slot throughput ceiling (kitchen pacing), not the capacity source of truth — removing a field from a live collection is destructive and unnecessary.

Table combining uses an **explicit `combinesWith` adjacency relationship**, not `zone` grouping: physical adjacency is a fact only the owner knows, and enumeration walks only declared edges, keeping it a bounded graph problem.

Concurrency on the last free table is handled at the route layer: after `create`, the booking endpoint re-queries the block and, if an earlier-`createdAt` reservation now shares a table, re-runs assignment or returns `409`. The pure assignment function stays pure; the route owns the guard.

## Consequences
+ The owner gets a real seating plan — every reservation has a table, drives the dashboard timeline grid.
+ No more silent overbooking — a party only books if a table (or valid combination) physically fits.
+ `availability.ts` stays pure and unit-testable; the new logic is deterministic, so it is fully covered by fixtures (see ADR-0014).
+ Repurposing rather than removing `maxSeatsPerSlot` keeps the migration non-destructive and gives the owner a kitchen-pacing lever for free.
- The slot scan is more expensive: per candidate slot it enumerates table options instead of summing a number. Bounded by table count × `maxCombineTables`; fine for a single restaurant, not free.
- `OpenSlot.seatsLeft` becomes `assignableTables` + `bestOption` — a breaking API-shape change that the `BookingForm` on `/reservierung` must absorb.
- Existing reservations migrate with empty `assignedTables`; until the owner assigns them they block no specific table (they still count toward the soft ceiling).
? Concurrency: the re-query guard is correct but not airtight under heavy simultaneous load. A `bookingLocks` collection with a unique `date|tableId` index is the stronger fix if Parpali's volume ever warrants it.
? Reminder emails need a scheduled trigger (`/api/cron/reminders` hit by a VPS cron) — a new moving part the deployment must wire up.

## Alternatives Considered
- **Keep the seat pool, add a nullable table field for display only.** Rejected — assignment would not be validated against capacity, so the pool would still overbook and the dashboard would show impossible seatings. Half a model is worse than either whole one.
- **AI/LLM table assignment.** Rejected — assignment is a bounded constraint-satisfaction problem with an obvious deterministic optimum. An LLM adds latency, per-call cost, non-determinism, and an untestable failure mode for zero benefit. AI may earn a place later for *prediction* (no-shows, pacing), never for core assignment.
- **Infer combinable tables from `zone`.** Rejected — two terrace tables on opposite ends of the terrace must not auto-combine. Adjacency is physical reality the owner must declare; `zone` is for filtering and display only.
- **Remove `maxSeatsPerSlot` outright.** Rejected — destructive on a live collection, and the field is genuinely useful repurposed as a kitchen-throughput cap independent of physical seating.

## Revisit When
- Simultaneous-booking volume produces observed double-bookings the re-query guard misses — promote to the `bookingLocks` approach.
- Parpali wants multi-room floor plans or table shapes/positions (spatial view) — the flat `Tables` collection would need geometry.
- A second restaurant needs this system — multi-tenancy reopens the whole data-model scope (explicitly out of scope here).
- `enumerateTableOptions` becomes a measured hot path — revisit `maxCombineTables` or precompute combination groups.
