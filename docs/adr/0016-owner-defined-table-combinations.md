# ADR-0016: Owner-Defined Table Combinations Replace the Adjacency Graph

## Status
Proposed (2026-10-13) — supersedes the table-combining part of ADR-0012.

## Context
ADR-0012 combined tables by walking an explicit `combinesWith` adjacency graph (bounded by `BookingSettings.maxCombineTables`) and seating a group at the **sum** of its tables' capacities. Combining was preconfigured by the seed and never surfaced in `/manage`, so the owner could not change it.

After numbering the real floor, the owner (voice notes, 2026-10-04) gave a short, fixed list of what may be pushed together:

- Tisch 1 + 2 → 4 guests
- Tisch 1 + 3 → 6 guests
- Tisch 1 + 2 + 3 → 10–12 guests
- Tisch 4 + 5 → 6–8 guests
- everything else stays single (4 and 5 are 4-tops on their own).

Two things break the old model: (1) the rule is a **whitelist of exact groups**, not "any connected neighbours"; (2) a group's seat count is **not the sum** of its tables — 1+2 = 4 and 1+3 = 6, yet 1+2+3 = 12, which no set of per-table capacities can produce.

## Decision
`BookingSettings` gets a `tableCombos` array: `{ tables (≥2), minParty?, maxParty }`. `enumerateTableOptions` offers single tables plus **only** the configured combinations whose member tables are all free/active and whose `minParty..maxParty` range contains the party size; a combination's capacity is its `maxParty`. Best-fit ranking (least waste → fewest tables → sortOrder) is unchanged.

`Tables.combinable`, `Tables.combinesWith` and `BookingSettings.maxCombineTables` are removed from schema, UI, API and seed (old values stay inert in MongoDB). The owner edits combinations in `/manage → Tische` (new "Tisch-Kombinationen" section, `POST /api/manage/table-combos`).

## Consequences
+ Matches how the owner thinks about the room; no impossible capacity arithmetic.
+ Enumeration is linear in the number of combinations — the combinatorial guard (`maxCombineTables`) is no longer needed.
+ Owner can change combinations without the Payload admin.
- An empty list means no combining at all: parties larger than every single table cannot book online until combinations are entered. The live list must be filled right after deploy.
- `maxPartyOnline` (default 8) still caps online bookings — the 10–12 combination only helps online once that cap is raised; otherwise it serves dashboard bookings.

## Alternatives considered
- **Keep adjacency, add per-group capacity overrides.** Rejected — two concepts to configure for what the owner states as one list.
- **Model capacities so sums work out.** Impossible for the given numbers (see Context).
