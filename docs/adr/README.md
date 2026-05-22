# Architecture Decision Records

This directory holds the project's ADRs — short Markdown documents that record non-trivial technical decisions in [Michael Nygard's format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions). One screen, ~5 minutes to write, one decision per file.

ADRs answer the **why** that code, tests, and commit messages can't carry — including the alternatives we rejected and the conditions under which the decision should be reconsidered.

> **The rule:** ADRs are never deleted and never retroactively edited. When a decision changes, write a new ADR and mark the old one `Superseded by ADR-MMMM`. The history is the point.

## Why we do this

See [ADR-0000](./0000-record-architecture-decisions.md) for the full reasoning. The short version: small team + heavy AI assistance + agency-template ambitions = if architectural decisions aren't written down, they evaporate within weeks. AI tooling especially benefits — when Claude reads `docs/adr/`, it stops fighting our architecture.

## Status legend

| Status | Meaning |
|---|---|
| `Proposed (YYYY-MM-DD)` | Drafted, under discussion. Becomes `Accepted` when the PR introducing it merges. |
| `Accepted (YYYY-MM-DD)` | In force. The repo reflects this decision. |
| `Deprecated (YYYY-MM-DD)` | No longer recommended, but not yet replaced. Avoid following this in new code. |
| `Superseded by ADR-MMMM (YYYY-MM-DD)` | Replaced by a newer ADR. The new ADR's body links back. |

## Index

| ADR | Status | Title |
|---|---|---|
| [0000](./0000-record-architecture-decisions.md) | Accepted (2026-05-14) | Record Architecture Decisions |
| [0001](./0001-decommission-webflow.md) | Accepted (2026-05-14) | Decommission Webflow Code Components |
| [0002](./0002-nextjs-payload-stack.md) | Accepted (2026-05-14, amended) | Next.js 16 App Router + Payload 3 as Target Stack |
| [0003](./0003-repo-as-fork-template.md) | Accepted (2026-05-14) | This Repo Serves as a Fork-Template for Similar Customer Projects |
| [0004](./0004-gsap-lenis-animation-stack.md) | Accepted (2026-05-14) | GSAP + Lenis as the Animation Stack |
| [0005](./0005-design-system-isolated-layer.md) | Accepted (2026-05-14) | Design System is an Isolated, Swappable Layer |
| [0006](./0006-payload-database-sqlite-then-postgres.md) | Superseded by ADR-0007 (2026-05-14) | Payload Database — SQLite Now, Production DB Deferred |
| [0007](./0007-use-mongodb-across-soter-projects.md) | Accepted (2026-05-14) | Use MongoDB Across All SOTER Projects |
| [0008](./0008-blocks-pipeline-and-pages-posts-collections.md) | Proposed (2026-05-14) | Blocks Pipeline + Pages/Posts Collection Shape |
| [0009](./0009-component-prop-widening-for-cms-media.md) | Proposed (2026-05-14) | Component Prop Widening for CMS-Sourced Media |
| [0010](./0010-posts-collection-prose-blocks-and-globals.md) | Proposed (2026-05-14) | Posts Collection, ProseBlocks for Body, Navigation + Footer Globals |

For a live view including superseded ADRs, run `/adr-list` in Claude Code.

## When to write an ADR

**Write one when** the decision is non-obvious enough that future-you would ask "wait, why did we do this?" in 6 months. Practical triggers:

- Choosing between libraries/frameworks for the same job (Payload vs. Strapi; GSAP vs. Framer Motion)
- Architecture boundaries (where Payload starts and Next ends; how blocks render)
- Data model decisions (which collection owns what; how globals are scoped)
- Trade-offs that involve giving something up (no Webflow visual editor, no commercial GSAP plugins)
- Anything that constrains future work (the design-system isolation contract)

**Don't write one when:**

- It's a coding convention (Prettier formatting, naming, folder structure) → put it in `CLAUDE.md` instead
- A reasonable senior dev would make the same call in 30 seconds → it's a no-brainer, not a decision
- It's specific to one feature's implementation → comments in the code or the PR description suffice
- It's fundamental and uncontested ("we use React") → README or stack list

If you're not sure, lean toward writing one. The cost is 10 minutes; the cost of not writing it can be days of confusion later.

## How to write one

1. Run `/adr-new "<verb-first title>"` in Claude Code. This auto-numbers and scaffolds from `_template.md`.
2. Fill in **Context** (what forced the decision), **Decision** (what we'll do — present tense, one paragraph), **Consequences** (+ benefits, − costs, ? open risks), **Alternatives Considered** (at least 2, honest), **Revisit When** (concrete triggers).
3. Open the PR. Status stays `Proposed (today)` during review.
4. On merge, edit Status to `Accepted (merge-date)` and add the row to this index.
5. Reference the ADR number in the PR description and any related commits.

Or invoke the `adr-writer` agent (`Agent` tool with `subagent_type: adr-writer`) — give it the session context and it'll draft an ADR you can edit.

## How to supersede an existing ADR

Use `/adr-supersede <old-NNNN> "<new title>"`. This:
- Scaffolds a new ADR with a `Supersedes ADR-NNNN` reference
- Flips the old ADR's Status to `Superseded by ADR-MMMM (today)`
- Leaves all other content in the old ADR intact

**Do not delete or rewrite the old ADR.** The whole point is the trail.

## Conventions

- **Numbering:** zero-padded 4 digits (`0001`, not `1`). Never reuse a number even if the ADR is superseded.
- **Filenames:** `NNNN-kebab-case-title.md`. Keep the title short — full title goes inside the file.
- **Tone:** plain, direct, opinionated. Future-you isn't impressed by hedging.
- **Length:** one screen ideal, two screens max. If you need three, you're conflating multiple decisions — split.
- **Cross-references:** when one ADR depends on another, link by number (`see ADR-0003`). When one ADR supersedes another, link both directions.
