# ADR-0002: Next.js 16 App Router + Payload 3 as Target Stack

## Status
Accepted (2026-05-14) — amended 2026-05-14 to pin Next.js 16 (was 15)

## Amendment (2026-05-14)
At install time the current stable Next.js was 16.2.6, and Payload 3's blank template targets Next 16. We pinned Next 16 rather than the older 15. This is a version-pin clarification, not a stack pivot — the decision (Next App Router + Payload 3 in-process) is unchanged.

## Context
Post-Webflow (ADR-0001), we need to choose the runtime stack that delivers:

1. **Server-rendered HTML for SEO** — landing pages and blog posts must be crawlable. A Vite SPA returns an empty `<div>` to Googlebot and social-share crawlers.
2. **A CMS we control** — for blog posts now, marketing pages and globals later. Schema flexibility matters; vendor lock-in does not.
3. **Image optimization, file routing, nested layouts** — built-in, not hand-rolled.
4. **A stack that's reasonable to fork for customer projects** (see ADR-0003) — the standard frontend stack any engineer we onboard already knows.

The current repo is Vite + React, built for the Webflow-Components era. The Vite preview SPA does not satisfy requirement 1 and would require us to build the rest from scratch.

## Decision
The target stack is **Next.js 16 App Router + Payload 3 CMS**, running as a single Next.js process (Payload 3 mounts as Next route handlers — `/admin/[[...segments]]` and `/api/[...slug]`).

Migration is staged (see the roadmap in `README.md`), not a big-bang rewrite. The component library, CSS Modules, design tokens, GSAP, and Lenis carry over byte-identical — only the framework shell changes.

## Consequences
+ SSR/SSG for SEO and OG previews works out of the box.
+ Payload runs in-process — no second deployment, no second auth domain, no API client to maintain. Local API (`payload.find(...)`) is a typed function call from a Next route.
+ `next/image`, `next/font`, file-based routing, RSC — table stakes we don't have to build.
+ Forkability (ADR-0003): any frontend engineer can pick up this template without learning a niche framework.
- We give up some build speed (Vite is faster). The cost is real but bounded — Next 16 with Turbopack is acceptable.
- Payload's admin UI is "engineer-good," not "Webflow-good" for non-dev content editors. Trade-off we accept (see ADR-0001).
- Next is opinionated — App Router specifically. Some patterns (nested layouts, client/server boundary) require deliberate care.
? Self-host story (Hetzner + Docker vs. Vercel + Neon vs. Coolify) is open — separate ADR when we pick.

## Alternatives Considered
- **Astro + a separate Payload service.** Astro is excellent for content-heavy static sites. Rejected because it would split the project in two (Astro frontend + Payload backend on different domains), defeat Payload 3's selling point (in-process Next integration), and require us to build a typed API client by hand.
- **Remix.** Genuinely close call. Same SSR story, same file routing, mature ecosystem. Rejected because Payload's tightest integration (and the bulk of Payload's docs / community examples) target Next. We'd be fighting friction we don't need to fight.
- **Vite + Vike (vite-plugin-ssr).** Rejected because we'd be building the Payload-Next plugin equivalent from scratch — exactly the work Payload 3's Next adapter saves us. Plus Vike's user base is much smaller, so future contributors and forkers would have a steeper ramp.
- **Stay on Vite, give up SEO / use prerendering.** Rejected — prerendering a SPA gets you 80% of SEO benefit and 0% of CMS benefit. Not worth the technical-debt cost.

## Revisit When
- Payload deprecates the Next adapter or pivots away from Next as its primary host (very unlikely; Next-native is their pitch).
- A customer fork (ADR-0003) requires a stack we don't support in Next (e.g., heavy native iOS app shell — but at that point it's not a website).
- Next's licensing or hosting story changes adversely (e.g., Vercel-only features creep into Next core in a way that hurts self-hosting).
