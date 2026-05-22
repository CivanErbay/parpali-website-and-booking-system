# ADR-0005: Design System is an Isolated, Swappable Layer

## Status
Accepted (2026-05-14)

## Context
ADR-0003 commits this repo to function as a fork-template for customer projects. For that promise to hold, customer rebrands must be cheap — ideally "swap the design system, leave everything else alone." If brand colors, fonts, or strings leak into component code, every rebrand becomes archaeology.

In agency / template codebases without this discipline, the common failure mode is: a component CSS file picks `#D6FF5C` directly instead of `var(--accent)`, a Hero hardcodes the company name in JSX, a font is imported in three places. Three months later, "just change the colors" means grepping 200 files.

Generative AI raises the stakes. Skills like `ui-ux-pro-max` and similar happily produce CSS with raw hex and rgb values; if we don't constrain them, every AI-assisted change risks bypassing the design system.

## Decision
The design system is a single, isolated, well-defined layer.

**The design-system layer comprises:**
- `src/shared/tokens.css` — all CSS custom properties (colors, fonts, spacing, radii, borders, shadows).
- `src/shared/animations.ts` — all GSAP motion tokens (durations, eases, distances). See ADR-0004.
- `src/shared/colors.ts`, `src/shared/modes.ts` — typed helpers that consume tokens.
- `/public/brand/*` — brand assets (logo, favicon, OG defaults).
- *(Future)* `theme.config.ts` — customer-tweakable surface (brand name, primary accent, font-pair) re-exported into tokens at build time.
- *(Future, after Payload phase)* `SiteSettings` Global in Payload — runtime brand strings (company name, contact email, social links).

**The contract** (enforced by review, lint where possible):

1. Component CSS files (`*.module.css`) MUST use `var(--token)` — never raw hex (`#xxx`), raw rgb/hsl, named CSS colors, or font-family strings.
2. Component TSX files MUST NOT contain hardcoded brand strings (`"SOTER"`, company contact info, social URLs). Until Payload is in, these come from a single constants file; after Payload, from the `SiteSettings` Global.
3. Skill-generated code (uipro and others) is allowed to *suggest* structure and layout, but its color / typography / spacing output is replaced with our tokens before commit. The flow is "skill produces structure → we apply tokens" — never "skill produces tokens → we adopt them."
4. Introducing a new token (a new accent variant, a new spacing scale step, a new font) requires an ADR. Trivial uses of existing tokens do not.

**The customer-rebrand promise.** To rebrand a fork for a new customer, a contributor changes:
- `src/shared/tokens.css` (colors, fonts, optionally spacing)
- `src/shared/animations.ts` (only if the customer wants a different motion feel)
- `/public/brand/*` (logo, favicon)
- `theme.config.ts` once it exists
- `SiteSettings` Global in Payload (brand name, contact info)

Nothing else. If a rebrand needs to touch a component file, that's a bug in the design-system contract.

## Consequences
+ Per-customer rebrand is days, not weeks. The "fork → 3 changes → deploy" promise (ADR-0003) becomes real.
+ The discipline forces clean separation in SOTER's own codebase — no accidental brand leakage.
+ AI assistants (Claude, skill-generated code) can be given a single instruction ("use tokens, never raw values") and that instruction has teeth because the design-system boundary is concrete.
+ Token-based animation (ADR-0004) and token-based color work in tandem — one tweak point per axis.
- Slightly slower component authoring — every color / spacing / font usage costs one extra indirection (look up the token).
- Skill output requires a post-process review pass — "did the skill respect tokens?" — that's manual until we have a lint rule.
? We don't yet have automated enforcement. CSS-lint rules to ban raw hex in `*.module.css` are possible but not set up. The `code-reviewer` agent (`.claude/agents/code-reviewer.md`) catches the common cases on demand.

## Alternatives Considered
- **Don't formalize a design-system boundary; trust contributors to use tokens.** Rejected — this is exactly how every other agency template rots. Without an explicit contract, raw values creep in within weeks.
- **Use CSS-in-JS (Stitches, Vanilla Extract) with theme objects in TS.** Tempting because the boundary is enforced by types. Rejected because CSS Modules are already in place across 29 components — switching just to enforce token usage would be a months-long refactor, and we can get 90% of the benefit with discipline + reviewer + future lint.
- **Make every customer fork its own theme package consumed by a "core" library.** Premature. ADR-0003 explicitly says we don't extract a core package until we have ≥3 forks. The fork-and-rebrand path serves until then.
- **Allow per-component overrides that bypass tokens.** Rejected — escape hatches always get used, and the design-system promise is the whole point. If a component genuinely needs a value not in tokens, the right answer is "add a token via ADR," not "inline a value."

## Revisit When
- A CSS-lint rule (`stylelint-no-hardcoded-colors` or similar) reaches the maturity to enforce this automatically — adopt it as a CI check.
- A customer fork's design requirements are so different that swapping tokens is insufficient (e.g., they want a different layout system entirely). At that point the question becomes whether they should be a fork at all, or a separate codebase.
- The "future" items (`theme.config.ts`, Payload `SiteSettings` Global) ship — at that point this ADR may need a follow-up ADR formalizing the extracted shape.
