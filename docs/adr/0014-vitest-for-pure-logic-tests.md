# ADR-0014: Adopt Vitest for Pure-Logic Unit Tests

## Status
Proposed (2026-05-22)

## Context
`src/lib/availability.ts` is written with deliberate test discipline — pure functions, no I/O, no Payload imports, `now` injected so callers pass a real clock in production and a fixed one in tests. The file header literally says "so it's trivially unit-testable." But there is no test runner: `package.json` scripts are dev/build/start/typecheck/payload/generate/seed only. "Unit-testable" is currently aspirational — pure by convention, verified by nobody.

ADR-0012 rewrites `availability.ts` into materially harder logic: bounded graph enumeration of combinable tables, best-fit selection with a four-level tie-break, 2.5 h overlap windows. This is exactly the kind of code that regresses silently — a change to the tie-break order or an off-by-one in the overlap check produces plausible-but-wrong slots that no type check and no smoke test will catch. The dashboard's grid-layout logic (`src/lib/dashboard.ts`) has the same property.

## Decision
We adopt **Vitest** as the test runner for pure-logic modules in `src/lib/`. We add it as a dev dependency, add a `test` script (`vitest run`) and a `test:watch` script to `package.json`, and ship `src/lib/availability.test.ts` alongside the `availability.ts` rewrite as part of the same change — the rewrite is not "done" without it.

Scope is intentionally narrow: Vitest covers **pure logic** (`availability.ts`, `dashboard.ts`, and future pure helpers). It is not used for component rendering tests, end-to-end tests, or anything touching Payload, MongoDB, or the network — those remain manual (`pnpm dev` + the verification checklist) until a separate ADR decides otherwise. `pnpm typecheck` and `pnpm test` together become the pre-commit gate for changes touching `src/lib/`.

Vitest over Jest because the repo is ESM-native (`"type": "module"`), TypeScript, and built on the Vite/Next toolchain — Vitest runs `.ts` ESM with near-zero config; Jest would need a transform/ESM setup that is pure friction here.

## Consequences
+ The table-assignment algorithm — the highest-risk logic in the booking system — gets a regression net: best-fit selection, table combining, overlap windows, lead-time/blackout/holiday rules all become fixtures.
+ Tests double as executable documentation of the tie-break rules and edge cases, which prose in ADR-0012 only describes.
+ Near-zero config: ESM + TS work out of the box; one dev dependency, two scripts.
+ Sets a cheap precedent — the next pure helper gets a `.test.ts` for free.
- A new dev dependency and a new CI/pre-commit step to run and keep green.
- Coverage is partial by design — component and integration bugs are still caught only by manual testing, which can read as false confidence if "tests pass" is over-trusted.
? No CI runs tests automatically yet (the repo isn't even git-initialized locally). Until CI exists, `pnpm test` is a discipline step in the pre-commit checklist, not an enforced gate.

## Alternatives Considered
- **Jest.** The default many reach for. Rejected — ESM + TS + a `"type": "module"` repo make Jest configuration actively painful; Vitest is the modern fit for this toolchain.
- **`node:test` (built-in test runner).** Zero dependencies, appealing. Rejected — weaker TS-ESM ergonomics and assertion/watch experience than Vitest for what is still a real test suite; the one saved dependency is not worth the friction.
- **No runner; keep verifying by hand.** Rejected — that is the status quo, and it does not survive the `availability.ts` rewrite. Hand-tracing a four-level tie-break across combinable-table graphs on every change is not viable.
- **Add Playwright / full E2E now.** Rejected as premature — the immediate, concrete risk is the pure algorithm. E2E is a heavier, separate decision; this ADR deliberately keeps scope to pure logic.

## Revisit When
- The project gains CI — wire `pnpm test` in as a required check and this ADR's "discipline step" caveat goes away.
- There is appetite for component or end-to-end coverage — that warrants its own ADR (React Testing Library, Playwright) building on this one.
- Vitest and the installed Next/Vite major versions drift out of compatibility — re-verify the toolchain fit.
