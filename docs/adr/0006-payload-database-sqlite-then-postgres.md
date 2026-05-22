# ADR-0006: Payload Database — SQLite Now, Production DB Deferred

## Status
Superseded by [ADR-0007](./0007-use-mongodb-across-soter-projects.md) (2026-05-14)

The "deferred production DB choice" reasoning in this ADR was made in isolation, without weighting that SOTER's other projects all run on MongoDB Atlas. Operational coherence across the portfolio outweighs the schema-fit + dev-loop-friction arguments below. See [ADR-0007](./0007-use-mongodb-across-soter-projects.md) for the active decision.

## Context
Phase 3 of the migration roadmap ([ADR-0002](./0002-nextjs-payload-stack.md)) requires picking a database adapter for Payload 3. Three viable adapters exist: `@payloadcms/db-sqlite`, `@payloadcms/db-postgres`, `@payloadcms/db-mongodb`. The decision is load-bearing: the adapter shape leaks into migration tooling, query patterns, and hosting choice.

At this point in the project:
- We don't yet know the hosting target (ADR-0002 explicitly left this open).
- We need a working dev loop now — installing Next + Payload was the immediate goal of the install branch.
- The fork-template story ([ADR-0003](./0003-repo-as-fork-template.md)) implies the default DB should also be a sensible default for customer forks, not just for SOTER.

## Decision
**SQLite, via `@payloadcms/db-sqlite`, is the default database. Production-DB choice is deferred to a separate ADR.**

Concretely:
- `DATABASE_URI=file:./soter.db` is the committed default in `.env.example`.
- The local SQLite file (`soter.db`) is gitignored.
- We don't yet wire any Postgres-specific tooling, migration scripts, or hosting integration.
- A separate ADR will pick the production DB once hosting is chosen — likely Postgres (Neon, Supabase, or self-hosted) if we go Vercel/Hetzner-Docker, or stay on SQLite if we go to a single-VPS host with sufficient capacity.

## Consequences
+ Zero local-setup friction — no Docker, no Postgres install, no managed-DB account needed to boot the project.
+ Forkable: a customer who clones this repo can `pnpm dev` and have a working CMS immediately. Many customer sites will be perfectly served by SQLite forever (low-write CMS-driven marketing sites).
+ The Payload SQLite adapter is mature and content-modelling-compatible with the Postgres adapter — switching later is a config + data-migration job, not a schema redesign.
- A production migration from SQLite to Postgres (if/when we choose that path) involves writing a one-time data export/import step. Not free, but bounded.
- SQLite + Next.js does not run on Vercel's edge runtime, and pure-serverless deployments with ephemeral filesystems will lose the DB on every cold start. This precludes Vercel-Edge + SQLite as a hosting combination. If we go Vercel, we'll need Postgres at that point.
- For high-traffic scenarios (sustained > ~50 writes/sec or > 100GB DB size) SQLite becomes the bottleneck. Unlikely for a marketing site but worth flagging.

## Alternatives Considered
- **Postgres from day one (`@payloadcms/db-postgres`).** Rejected for now — adds a Docker/Neon dependency to the dev loop, and we don't yet know if Postgres is even the right production choice (Hetzner self-host vs. Neon vs. Supabase changes the trade-offs). Premature commitment.
- **MongoDB (`@payloadcms/db-mongodb`).** Rejected — Payload's original home, but our content is structured (blog posts, pages, globals with typed fields) and relational queries (e.g. "posts in category X by author Y") are awkward without joins. Plus another infra dependency for the dev loop.
- **Make the adapter swappable via env var.** Premature abstraction — would force us to write code generic across SQLite and Postgres semantics before we know we need both.

## Revisit When
- We pick a hosting target (Vercel + Neon, Hetzner + self-hosted Postgres, Coolify, etc.). That decision forces this one.
- A customer fork needs a different DB for their constraints (e.g., existing Postgres infra).
- Traffic patterns on SOTER's own site exceed SQLite's comfortable range, OR Payload deprecates the SQLite adapter.
