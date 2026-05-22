# ADR-0000: Record Architecture Decisions

## Status
Accepted (2026-05-14)

## Context
The `soter-website-payload` codebase is intended to (a) ship SOTER's own marketing site, (b) host blog content via Payload CMS, and (c) serve later as a fork-template for similar B2B customer sites (see ADR-0003). The team is small and AI assistants (Claude Code) contribute heavily — generating components, refactoring, suggesting architecture.

Two failure modes are real risks here:

1. **Decisions evaporate.** When you decide something in a 20-minute coding session, three months later nobody — human or AI — remembers whether that choice was deliberate or accidental. Without a trail, every contributor will eventually re-litigate or unknowingly contradict prior choices.
2. **AI generates plausible code that fights the architecture.** Claude can confidently write a new route using Prisma in a codebase deliberately built on raw SQL, because the codebase doesn't say *why* it's raw SQL. Same applies to picking Strapi over Payload, MongoDB over Postgres, Lottie over GSAP, etc.

We need a lightweight, in-repo, version-controlled trail of architectural decisions readable by humans **and** by AI assistants.

## Decision
We adopt Michael Nygard's ADR format. ADRs live in `docs/adr/`, are numbered `NNNN-kebab-title.md`, follow the template at `docs/adr/_template.md`, and are managed via three slash commands: `/adr-new`, `/adr-list`, `/adr-supersede`.

ADRs are **never deleted or retroactively edited**. When a decision changes, a new ADR is written and the old one's status flips to `Superseded by ADR-MMMM`. The history is the point — not the latest snapshot.

PRs introducing non-trivial architectural changes must link an ADR (the PR template at `.github/pull_request_template.md` prompts for this).

## Consequences
+ Future contributors (human or AI) can read `docs/adr/` and understand *why* the codebase is shaped the way it is, not just *what* it does.
+ Claude Code, when reading the repo, picks up the ADRs as long-term architectural memory — far more reliable than inference.
+ Disagreements surface earlier: a `Proposed` ADR is reviewable before code is written.
+ Customer forks of this template inherit the decision history, so it's obvious what's load-bearing vs. swappable.
- Small process tax: every non-trivial architectural choice needs ~10 minutes of writing.
- Discipline risk: if ADRs are skipped for "small" decisions that later compound, the trail rots.
? We don't yet have a CI check that fails PRs missing an ADR link when one is needed. For now, reviewer judgment.

## Alternatives Considered
- **Notion / Confluence pages.** Rejected because decisions get separated from the code they describe. `git blame` on a file can't surface the Notion doc that explains it. ADRs in-repo travel with the code.
- **Long-form prose in `CLAUDE.md` or `README.md`.** Rejected because conventions (Prettier, naming) and decisions (Payload vs. Strapi) have different lifecycles. Conventions are mutable and revised in place; decisions accumulate and are never edited. Mixing them obscures both.
- **No formal system, "we'll just write good commit messages".** Rejected because commit messages describe *what changed*, not *what was considered and rejected*. Alternatives Considered is the most valuable part of an ADR — git messages can't carry it well.

## Revisit When
- The ADR count exceeds ~50 and the index becomes hard to scan — at that point, consider grouping ADRs by area subdirectory (`docs/adr/frontend/`, `docs/adr/data/`, etc.).
- A CI tooling option emerges that can lint PRs for missing ADRs at a quality we trust — adopt it.
- The team grows past ~5 active contributors and the lightweight process breaks down — formalize the proposal/review step.
