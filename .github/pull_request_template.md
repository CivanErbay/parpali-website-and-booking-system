## Summary

<!-- 1–3 bullets: what this PR does and why. -->

-
-

## Architecture Decision?

> Rule of thumb (see `docs/adr/README.md`): if a future you would ask "wait, why did we do this?" in 6 months, this needs an ADR. If the choice is obvious, doesn't need one.

- [ ] **No** — trivial change / pure bugfix / aesthetic-only / convention enforcement.
  Reason:
- [ ] **Yes** — linked ADR: `docs/adr/XXXX-...md` (Status flips from `Proposed` → `Accepted` on merge).

## Convention or Design-System Change?

- [ ] **No**
- [ ] **Yes** — updated one or more of: `CLAUDE.md`, `src/shared/tokens.css`, `src/shared/animations.ts`, theme/brand config.
  See **ADR-0005** for the design-system contract.

## Test Plan

- [ ] `pnpm typecheck` passes
- [ ] `pnpm dev` boots and the affected pages render visually correct
- [ ] No new hardcoded hex colors, raw `px`, or hardcoded brand strings introduced outside the design-system layer (ADR-0005)
- [ ] (If animation changed) `prefers-reduced-motion` still respected; Lenis + GSAP RAF-sync intact

## Notes for Reviewer

<!-- Anything tricky? Want a second opinion on something specific? -->
