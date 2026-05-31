# ADR-0015: Explicit Last-Seating Time + Tablet Run-Sheet as the Host-Stand View

## Status
Proposed (2026-06-01)

## Context
The per-table booking engine (ADR-0012) and the `/manage` dashboard (ADR-0013) shipped before we had the restaurant's real operating parameters. A client meeting (2026-05) gave them:

- ~30 numbered tables, mostly 2-tops (combinable) plus some 4-tops.
- One seating ≈ 2.5 h.
- Service from **11:30**; **last reservation 21:00 on weekdays, 22:00 at the weekend**.
- The owner runs service from an **iPad** at the host stand, and books phone/walk-in guests by hand.
- They asked whether to use an external tool (OpenTable). Decided: **keep the custom engine** — it already exists, owns the guest data, and carries no per-cover commission. (Quandoo, a common German option, is winding down end of 2026; marketplace commission models don't fit a 30-seat neighbourhood restaurant.)

Two gaps surfaced against this reality:

1. **"Last seating" was only expressible indirectly.** `getOpenSlots` derived the last bookable slot as `close − tableHoldMinutes`. To get a 21:00 last seating with a 150-minute hold, the owner would have to set the closing time to 23:30; a 22:00 weekend last seating implies a past-midnight "close" that the naive wall-clock model (`HH:mm`, no day rollover) cannot express cleanly. The owner's mental model is literally "last table at 21:00 / 22:00" — the config should say that.

2. **The host-stand view was a horizontally-scrolling timeline grid** (tables × time). It's powerful for desktop planning but awkward on a touch tablet: it relies on drag-to-reassign (mouse-centric) and horizontal scroll, and it answers "who's coming and are they here yet?" only indirectly.

## Decision

**Last seating becomes a first-class field.** `OpeningSegment` gains an optional `lastSeating` (HH:mm) and `HolidayOverride` a `lastSeatingOverride`. When set, it caps the slot grid directly: `lastStart = min(lastSeating, close)`, independent of the hold — the table is simply held its 2.5 h past the last seating (a 21:00 booking keeps its table until 23:30, past a 23:30 "close", which is correct). When absent, behaviour is unchanged (`close − tableHoldMinutes`). The field is surfaced in the `OpeningHours` global editor and mapped through `bookingContext.ts`; the seed sets 21:00 weekdays / 22:00 weekend with open 11:30. Default `slotMinutes` moves 15 → 30 (offering times every half-hour reads more calmly than every 15 min for a 2.5 h turn).

**A tablet-first run-sheet becomes the primary `/manage` day view.** A new `RunSheet` component renders reservations as a vertical list grouped by service state — **Erwartet / Anwesend / Erledigt** — with large (≥44 px) touch targets, a fill summary (covers / capacity), name/phone search, one-tap status changes, and a quick-add bottom sheet for phone/walk-in bookings. Detail and add open as bottom sheets (side panel in tablet landscape). It is self-contained: it owns its fetch against the **existing** `/api/manage/reservations*` endpoints, so the engine and the existing grid are untouched. A `DayView` wrapper adds a **Liste / Zeitplan** toggle (choice persisted per device); the timeline grid (`DayBoard`) stays one tap away for desktop planning.

**Out of scope by decision (kept simple).** No waitlist, deposits/card-holds, guest CRM/history, analytics, SMS, dynamic pricing, graphical floor map, or per-day table-out-of-service in this pass. `maxSeatsPerSlot` and table `zone` remain dormant levers, not surfaced. The default 30-table floor plan is seeded with sensible combinable chains; the owner fine-tunes real adjacency in the config page.

## Consequences
+ The owner configures hours the way they think about them — "last table 21:00" — and the brittle past-midnight close is gone.
+ The host stand answers "who's next, who's seated, who no-showed" at a glance, with thumb-sized controls, on the device they actually use.
+ Zero engine churn: `RunSheet` reuses the assignment/concurrency logic and the status/reassign/create endpoints verbatim; `availability.ts` change is additive and fully unit-tested (lastSeating cap, fallback, clamp-to-close, holiday override).
+ The grid view is preserved, so no desktop workflow is lost.
- Two day-view components now share intent (status/reassign/quick-add). `RunSheet` deliberately re-implements a touch-tailored detail/add sheet rather than reusing `DayBoard`'s mouse-oriented panel; ~1 small duplication accepted for a genuinely different interaction model.
- `lastSeating` is owner-entered free text (HH:mm) like the existing open/close fields — no format validation beyond the algorithm's regex guard.
? The seeded weekly rhythm assumes service every day; whether Parpali has a Ruhetag (rest day) is flagged as a `TODO(owner)` in the seed and must be confirmed.

## Alternatives Considered
- **Keep deriving last seating from `close − hold`.** Rejected — unintuitive for the owner and unrepresentable for a 22:00 weekend last seating without a past-midnight close the wall-clock model can't hold.
- **Make the timeline grid touch-friendly and keep it as the only view.** Rejected — horizontal scroll + drag is the wrong primitive for a host stand; a run-sheet is the industry-standard primary view. Kept the grid as a secondary toggle rather than deleting it.
- **Switch to OpenTable / a commission marketplace.** Rejected — recurring per-cover cost, loss of data ownership, and overkill for one small restaurant that already has a working engine.
- **Add a graphical floor-plan view.** Deferred — needs a real spatial layout to be meaningful and adds complexity the brief explicitly wanted to avoid; the run-sheet covers the daily need.

## Revisit When
- The owner confirms a rest day or split lunch/dinner services — adjust the seeded `OpeningHours` (the model already supports multiple segments per day).
- Walk-in volume makes a live table-occupancy board more valuable than the run-sheet — revisit the deferred floor-plan view.
