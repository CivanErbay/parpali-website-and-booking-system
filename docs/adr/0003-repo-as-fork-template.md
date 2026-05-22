# ADR-0003: This Repo Serves as a Fork-Template for Similar Customer Projects

## Status
Accepted (2026-05-14)

## Context
SOTER does consulting / agency work and expects to deliver similar B2B and marketing sites (Next + CMS + scroll-driven storytelling + component-based composition) to multiple customers. Without a deliberate template strategy, each customer project either (a) starts from scratch and duplicates 80% of the work, or (b) is copy-pasted from a prior customer with their branding, which leaks identity and creates a maintenance nightmare.

We want the SOTER repo itself to double as the canonical template: forkable, rebrandable in a small number of localized changes, with strong guarantees about what's "framework" (stays) vs. "customer content" (replaced).

## Decision
`soter-website-payload` is designed so that any future customer project is a **fork** of this repo with **at most**:

1. A new design system (tokens + theme + brand assets) — see ADR-0005.
2. New CMS content (Pages, BlogPosts, Globals) — created in the admin, not in code.
3. New domain / hosting target.

The component library, animation system, page-block architecture, ADR system, and tooling stay byte-identical across forks (modulo intentional upstream patches).

This decision drives many concrete sub-decisions: the design system must be cleanly isolated (ADR-0005), brand strings must come from CMS Globals not code, the repo will be marked as a GitHub Template once stable, a seed script creates demo content so a fresh fork boots with something to look at.

## Consequences
+ Per-customer kickoff goes from "build it" to "fork → rebrand → seed → deploy" — multiple weeks compressed to days.
+ Bug fixes and feature additions made on SOTER's own site propagate to customer forks via rebase / cherry-pick.
+ The discipline of "no hardcoded brand strings" makes the SOTER codebase itself cleaner — forced separation of theme from structure.
+ ADR history travels with each fork — customer engineers can read the reasoning, not just the code.
- Architectural decisions need a higher bar: every choice has to make sense not just for SOTER but for plausible customer #2, #3. Some specificity is sacrificed for generality.
- Upstream/fork synchronization becomes ongoing work — patches don't apply automatically forever.
? We don't yet know how divergent customer forks will become in practice. If most forks diverge heavily, the template value drops.

## Alternatives Considered
- **Build SOTER's site standalone, extract a template later.** Rejected — "extract later" almost always means "never," and by the time we'd want to extract, customer-specific assumptions will be baked deep into every layer. Building with the template constraint from day one is cheaper than retrofitting it.
- **Build a CLI scaffolder (`create-soter-site`) instead of "fork the repo".** Tempting but premature. Until we have ≥3 customer projects and know what's actually variable, a CLI codifies guesses. Fork-and-rebrand is more honest about what's variable until we have data.
- **Make this a multi-tenant SaaS instead of per-customer forks.** Rejected — different customers want code-level control of their site (custom blocks, custom integrations). A multi-tenant SaaS would either constrain that or push us toward Webflow-style limits, which is what we just left (ADR-0001).

## Revisit When
- We've shipped 3+ customer forks and have data on what diverged most — that data should inform whether to extract a CLI, formalize a "core" package, or split the repo.
- Maintaining the fork sync becomes meaningfully expensive (> 1 dev-day / month per active fork).
- A customer needs something so far outside the template scope that the constraint becomes a hindrance rather than a discipline.
