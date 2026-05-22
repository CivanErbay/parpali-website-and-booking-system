# ADR-0013: Owner Dashboard as an Authenticated `(manage)` Route Group

## Status
Proposed (2026-05-22)

## Context
Parpali's staff need to manage reservations day-to-day: see who is coming, on which table, at what time; reassign tables; mark guests seated / no-show; take a walk-in or phone booking. The only owner-facing surface today is Payload's generic `/admin` CRUD list — a flat, sortable table of documents. It cannot render a per-table timeline, a week overview, or drag-and-drop reassignment, and customizing Payload's admin UI deeply means fighting its layout system.

The repo already has authentication: `Users` has `auth: true`, so Payload issues a session cookie (`payload-token`) via its local strategy. The repo's route convention (CLAUDE.md) is that each route group owns its own `<html><body>` — `(site)` and `(payload)` each render their own document shell, and there is deliberately no root `src/app/layout.tsx`.

The public booking endpoints (`/api/availability`, `/api/reservations`) call Payload with `overrideAccess: true` because `Reservations.access.create` is `false` at the REST layer — the route *is* the controlled gate. A dashboard's mutation endpoints have no such gate and must authenticate every request.

## Decision
The owner dashboard is a new authenticated `(manage)` route group served at `/manage`, a purpose-built UI in the same Next.js app — not a Payload admin customization.

`(manage)/layout.tsx` renders its own `<html><body>` (no `SmoothScroll` — a data dashboard uses native scroll). A pathless `(authed)` subgroup holds every protected page; its layout calls `requireUser()`, which runs `payload.auth({ headers })` and `redirect('/manage/login')` when there is no user. The `login` page sits outside `(authed)` so it stays public, and posts to Payload's built-in `/api/users/login`.

Dashboard pages are server components that read Payload with **normal access as the logged-in user** (not `overrideAccess`) — `Reservations`/`Tables` already grant `req.user`. Mutations go through `/api/manage/*` routes, each wrapped in `withUser()` (`src/lib/manageAuth.ts`), which returns `401` without a valid session before any work runs.

This establishes a **two-posture rule**, recorded here as the canonical reference: public `/api/*` endpoints authorize via the route itself and use `overrideAccess`; `/api/manage/*` endpoints always authenticate first and never rely on `overrideAccess` as a substitute for an auth check. The `/manage` path prefix keeps the two postures grep-able.

## Consequences
+ Full UX control — timeline grid, week view, drag-and-drop reassignment are plain React, unconstrained by Payload's admin shell.
+ No new auth system — reuses Payload's existing session cookie and `Users` collection; `/admin` remains available for raw data fixes.
+ The pathless `(authed)` group means one `requireUser()` call in one layout protects every dashboard page; adding a page needs no extra wiring.
+ The two-posture rule makes the `overrideAccess` vs. authenticate decision explicit instead of folklore — a reviewer can check it by path.
- Two booking-creation paths now exist (public `/api/reservations`, staff `/api/manage/reservations`) that must keep their table-assignment logic in sync — mitigated by both calling the same pure `assignTableForBooking`.
- The dashboard is a second front-end surface to style and keep accessible; it shares tokens/fonts with `(site)` but has its own components.
? `payload.auth()` in route handlers / RSC is the documented local-API path, but session-cookie forwarding through Next 16's async `headers()` is a spot to verify early — hence "build the shell and confirm the redirect before building pages" in the plan.

## Alternatives Considered
- **Custom views inside the Payload `/admin` panel.** This almost won — it would reuse Payload's auth and nav for free. Rejected because a per-table timeline and drag-and-drop reassignment fight Payload's admin layout; the result would be a compromised UX, and "state-of-the-art dashboard" was an explicit goal.
- **A separate standalone app/repo for the dashboard.** Rejected — it would duplicate the Payload client, the data model, the design tokens, and the deployment. The dashboard and the booking logic share too much; one app with route groups is the lighter structure.
- **A third-party reservation SaaS (OpenTable, resmio, Quandoo).** Out of scope by the project's framing — the booking system is being built in-house on top of the existing site — but noted as the honest "buy not build" baseline.
- **NextAuth / a bespoke auth layer for the dashboard.** Rejected — `Users` with `auth: true` already exists; adding a parallel auth system would be two sources of truth for one small staff login.

## Revisit When
- Multi-tenancy is on the table — per-restaurant logins, roles, and tenant isolation would reopen both the auth model and the route structure.
- Staff need role separation (e.g. host vs. manager vs. owner) — Payload supports field-level access and roles, but the `(authed)` layout's single `requireUser()` gate would need to become role-aware.
- `payload.auth()` behavior changes across a Payload major version — re-verify the session-forwarding path.
