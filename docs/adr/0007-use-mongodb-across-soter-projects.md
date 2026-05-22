# ADR-0007: Use MongoDB Across All SOTER Projects

## Status
Accepted (2026-05-14) — supersedes [ADR-0006](./0006-payload-database-sqlite-then-postgres.md)

## Context
[ADR-0006](./0006-payload-database-sqlite-then-postgres.md) (Proposed earlier the same day) recommended SQLite for local dev and deferred the production DB choice. The reasoning leaned on schema-fit ("structured content fits relational better") and dev-loop friction ("Postgres needs Docker").

That reasoning is correct *in isolation* but missed the bigger operational picture: **SOTER's other projects all run on MongoDB Atlas**. Picking SQLite/Postgres here would create:

- A second DB engine in our ops surface for a single project
- A separate backup, monitoring, and migration story
- A different mental model for whichever developer rotates onto this codebase next

Operational coherence across an agency's portfolio outweighs theoretical schema-fit for any one project.

## Decision
**MongoDB is the database for `soter-website-payload`, via `@payloadcms/db-mongodb` (Mongoose-based adapter). Local dev and production both use MongoDB Atlas on the existing SOTER organization account.**

Concretely:
- `db: mongooseAdapter({ url: process.env.DATABASE_URI })` in `src/payload.config.ts`
- `DATABASE_URI` is an Atlas connection string (`mongodb+srv://...`), provisioned by whoever owns the SOTER Atlas org (Civan, in this case)
- Each environment (local dev, staging, prod) gets its own database name on the shared cluster, not its own cluster
- No Docker or local `mongod` install required — devs point at Atlas with their own credentials

## Consequences
+ **One DB engine across all SOTER projects.** Backups, monitoring, on-call runbook, DBA mental model all transfer 1:1.
+ **Dev and prod use the same DB engine.** No "works on my SQLite, breaks on prod Postgres" surprises.
+ **Forkability (ADR-0003) becomes opinionated, not flexible.** A customer who forks this template inherits the Mongo assumption. That's a feature, not a bug, for our portfolio strategy — but if a customer fork specifically needs another DB, they swap the adapter (one config-file change) and update their own ADR.
+ Atlas free tier (M0) is plenty for dev. Production scaling on Atlas is a pricing-and-tier decision, not a re-architecture.
- **No offline dev.** A laptop without internet can't boot the project. Acceptable for an agency where every dev has reliable connectivity; we'll revisit if it becomes friction.
- **Mongo's relational ergonomics.** Cross-collection queries (e.g. "posts in category X by author Y") rely on Payload's relationship handling on top of Mongoose. Works, but the SQL equivalent would be cleaner — accepted as part of the trade.
- **Schema migrations.** Mongo's schemaless nature means data-shape changes are managed in application code (Payload) rather than DDL. Payload handles this well, but every collection change is a "soft" migration we still need to think about.

## Alternatives Considered
- **Keep SQLite (ADR-0006 status quo).** Rejected — sole project on a different DB engine is operationally expensive over time.
- **Postgres on Atlas-equivalent (Neon, Supabase, RDS).** Rejected because SOTER doesn't run any other project on Postgres; introducing it for one project is the same mistake as SQLite in reverse.
- **Mongo self-hosted (Docker / VPS).** Rejected for dev (Atlas free tier removes the setup burden); rejected for prod because Atlas's managed backup + multi-region replicas are worth the price at our size.

## Revisit When
- SOTER as an org migrates off Mongo (then we follow that decision, not the other way around)
- A customer fork has a hard requirement for another DB and we extract the DB choice into a per-fork ADR
- Atlas pricing changes adversely or feature parity slips behind self-hosted Mongo
