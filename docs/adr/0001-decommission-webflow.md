# ADR-0001: Decommission Webflow Code Components

## Status
Accepted (2026-05-14)

## Context
The SOTER site (and its v1–v3 predecessors) shipped as **Webflow Code Components**: React components built with Vite, packaged via `@webflow/webflow-cli`, uploaded to Webflow's CDN, then placed in pages by Webflow's visual editor. Webflow rendered the actual pages; we shipped only the JS bundles and descriptor schemas.

This worked while the system was small. Over v3 → v4 it stopped working:

- Landing pages are now composed in React (StartupsLanding, BlogArticleLanding) — Webflow's visual page-builder is no longer load-bearing for layout decisions.
- GSAP + Lenis integration is more reliable outside Webflow's runtime (shadow-DOM scoping, html-element access for Osmo scaling, RAF ownership).
- The content pipeline (blog, case studies, podcast) wants a CMS we control. Webflow CMS does not model what we need without contortions.
- The `*.webflow.tsx` descriptor files were a duplicate schema layer that drifted from prop types in the real component files.

## Decision
Remove all Webflow-specific infrastructure from the repo. The component library stays — the components themselves are framework-agnostic React + CSS Modules and have no Webflow imports. Only the Webflow *coupling* leaves.

Concretely removed (commit `6ddbb0a` on 2026-05-14):
- 29× `*.webflow.tsx` descriptor files
- `webflow.json` workspace manifest
- `@webflow/data-types`, `@webflow/react`, `@webflow/webflow-cli` devDependencies
- `share`, `share:dry`, `auth` npm scripts

## Consequences
+ Components are now portable React/TS — usable in any host (Next, Astro, Remix). This unlocks ADR-0002.
+ ~7700 lines off the lockfile, 30 files off the repo — smaller blast radius for any future change.
+ One canonical schema per component (just the `.tsx` props interface), no drift.
- We give up Webflow's visual page-composition for non-devs. If a non-dev needs to edit content, they'll use the future Payload admin (ADR-0002).
- Webflow account / project / domain still exist temporarily — needs explicit teardown later, once the new stack reaches parity.
? Some early dev/preview workflows (e.g., `webflow library share --dry-run` for schema validation) had no equivalent yet. Mitigated by `pnpm typecheck` doing the same job for in-repo schema.

## Alternatives Considered
- **Keep Webflow as the production host, just stop using Code Components.** Rejected — we'd still pay for Webflow hosting and be locked into their CMS, with no real benefit since pages are React-composed now.
- **Move to Webflow's newer DevLink (Code Export).** Rejected — still couples us to Webflow's content model and visual editor, just inverted. Doesn't fix the underlying mismatch.
- **Keep `.webflow.tsx` files dormant in case we reverse course.** Rejected — they were guaranteed to rot the moment a real `.tsx` prop changed. Cheaper to recover from git history if we ever need them.

## Revisit When
- A specific customer fork (ADR-0003) needs Webflow-like visual page editing for non-devs that Payload's admin doesn't satisfy.
- Webflow ships a true "Code Components on your own host" mode that's not vendor-coupled (very unlikely).
