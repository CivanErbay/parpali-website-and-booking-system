# CLAUDE.md — Project Guide

This file is the shared brain for everyone working in `parpali-website` — human contributors and AI assistants alike. Claude Code reads it automatically at the start of every session.

---

## Parpali addendum (this fork)

`parpali-website` is the website for **Parpali**, an Italian + international restaurant. It was forked from `soter-website-payload` (ADR-0003 made the SOTER repo a forkable template) and the rest of this file documents the inherited patterns. Read this addendum first; the unmodified baseline guide follows.

**What changed in the fork:**

- **Brand & design system** — `src/shared/tokens.css`, `src/shared/colors.ts`, `src/shared/modes.ts` rewritten with Parpali colors (deep red, warm gold, cream, espresso, olive). `src/app/(site)/layout.tsx` swapped to **Playfair Display SC + Karla + Space Mono** via `next/font`. CSS variable namespace renamed `--soter-*` → `--parpali-*` across all 36 files (semantic names: `lime→red`, `chartreuse→gold`, `ink→espresso`, `paper→cream`, `bone→sand`, `dust→olive`, `rust→terracotta`).
- **Default mode flipped** — `light` (cream paper) is now the default in `modes.ts`; the `dark` variant is kept available for the footer.
- **New collections** — `MenuItems`, `Reservations`, `Inquiries`, `Testimonials`, `Events` (`src/collections/`).
- **New globals** — `OpeningHours`, `BookingSettings`, `ContactInfo` (`src/globals/`).
- **Booking system** — pure slot logic in `src/lib/availability.ts`, API routes at `src/app/api/availability/route.ts` and `src/app/api/reservations/route.ts`, client form at `src/components/BookingForm/`.
- **Email** — Resend wrapper in `src/lib/email.ts`. Without `RESEND_API_KEY` in env, sends are no-op'd and logged.
- **Localization enabled** in `payload.config.ts` (`de` default + `en`). Localized fields flagged on user-facing collections.
- **Pages added** — `/menu` (server-rendered from MenuItems), `/reservierung` (BookingForm).
- **Deployment** — `docker-compose.yml` and `.github/workflows/deploy.yml` repointed to `ghcr.io/cartel-design/parpali-website` and `parpali.de` (Traefik routing). `/srv/parpali-website` on the existing Hostinger VPS.
- **Seed** — `scripts/seed.ts` rewritten to bootstrap Parpali Globals + sample Speisekarte.

**What did NOT change (inherited patterns still apply):**

- Lenis + GSAP RAF sync, ScrollTrigger + matchMedia + reduced-motion gate, `useGSAP` over raw `useEffect`
- Route groups own their own `<html><body>` (no `src/app/layout.tsx`)
- Block-driven Pages + ProseBlocks for Posts; SiteChrome reads Navigation + Footer Globals
- Component prop pattern: `bgColor` / `textColor` / `accentColor` overrides, no hardcoded brand strings in TSX
- Design-system contract: component `*.module.css` MUST use `var(--token)` — **never raw hex**. AI skills supply structure, not tokens.

**Cleaned up after the fork (no more SOTER blocks/components/routes):**

- Block palette stripped down to four generic blocks: `HeroPage`, `Intro`, `CtaBlock`, `Chapter` (the last allows `Intro` and `CtaBlock` as children). Removed: `AuditPreview`, `Calendly`, `Cases`, `OverviewCards`, `ProcessSteps`, `ProblemList`. Restaurant-specific blocks (`MenuPreviewBlock`, `ReservationCTABlock`, `TestimonialCarouselBlock`, `TodaysSpecialBlock`, `OpeningHoursBlock`, `GalleryStripBlock`) come in Phase 4.
- Components stripped to the actually-used set: `HeroPage`, `Intro`, `Chapter`, `CtaBlock`, `ArrowIcon`, `ContactForm`, `DotRow`, `SectionEyebrow`, `SiteHeader`, `SiteFooter`, `BookingForm`, `MenuList`. All SOTER-specific blog / agency / podcast / case-study components removed.
- `Posts` collection, ProseBlocks, blog pages (`/article/[slug]`), `src/posts/`, and the `/component-library` route are gone. Blog/journal can be re-added cleanly in a later phase.
- `src/shared/animations.ts` stripped to the four tokens that are actually consumed (`smoothScroll`, `chapterRail`, `chapterReveal`, `arrowHover`).

**Still inherited as reference (kept on purpose):**

- `docs/adr/` are SOTER's ADRs. Kept as historical context for the patterns we still follow (Lenis + GSAP RAF sync, design-system isolation, Pages block pipeline). New Parpali decisions go in new ADRs.

**Still outstanding (Phase 4/5):**

- Pages `/galerie`, `/ueber-uns`, `/kontakt`, `/events`.
- Next.js i18n routing — Payload localization is enabled (`de` + `en`), but routes are DE-only. Add a `[locale]` segment + middleware in Phase 5.

---

## Inherited baseline guide (do not edit unless the rule itself has changed for Parpali)

It is **not** the place for architectural decisions (those go in [`docs/adr/`](./docs/adr/README.md)) or per-component docs (those live next to the code). It captures the conventions, patterns, and rules everyone should follow without re-deriving them.

---

## What this repo is

`soter-website-payload` is the codebase for the SOTER website. Its three jobs:

1. Ship SOTER's own marketing site and blog.
2. Run on Payload 3 CMS in-process (Next.js route handlers).
3. Serve as a forkable template for similar B2B/agency customer projects (see [ADR-0003](./docs/adr/0003-repo-as-fork-template.md)).

Current state: **Next.js 16 + Payload 3 running on MongoDB Atlas** ([ADR-0002](./docs/adr/0002-nextjs-payload-stack.md), [ADR-0007](./docs/adr/0007-use-mongodb-across-soter-projects.md)). Vite decommissioned during the Next migration; Webflow before that ([ADR-0001](./docs/adr/0001-decommission-webflow.md)). The phase roadmap lives in [`README.md`](./README.md#roadmap).

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Payload 3 CMS**, in-process via `@payloadcms/next`
- **MongoDB Atlas** via `@payloadcms/db-mongodb` — same engine across all SOTER projects ([ADR-0007](./docs/adr/0007-use-mongodb-across-soter-projects.md))
- **Hetzner Object Storage** (S3-compatible) via `@payloadcms/storage-s3` — conditional, falls back to local `/media/` when env vars are absent
- **Block-driven pages**: Pages collection + block palette in `src/blocks/` ([ADR-0008](./docs/adr/0008-blocks-pipeline-and-pages-posts-collections.md))
- **CMS-driven blog**: Posts collection with ProseBlocks-based body ([ADR-0010](./docs/adr/0010-posts-collection-prose-blocks-and-globals.md))
- **Site chrome via Globals**: Navigation + Footer Globals drive the SiteHeader / SiteFooter values; no hardcoded link sets
- **React 19 + TypeScript 5**
- **GSAP 3.15** + `@gsap/react` + ScrollTrigger + CustomEase ([ADR-0004](./docs/adr/0004-gsap-lenis-animation-stack.md))
- **Lenis 1.3** smooth scroll, RAF-synced with GSAP
- **CSS Modules** with design tokens in `src/shared/tokens.css`
- **next/font** for DM Sans + Space Mono (exposed as `--font-dm-sans` / `--font-space-mono`)
- **PostHog** analytics (EU region)
- **pnpm** as package manager (run `pnpm install`, not `npm install` — pnpm-lock is the source of truth)

## Working conventions

### Commits

- Conventional-style with a short hyphen-separated suffix: `feat: …`, `fix: …`, `chore: …`, `docs(adr): …`.
- Bullet body for non-trivial changes. Past tense in the body is fine; imperative subject preferred.
- `Co-Authored-By` for AI-assisted commits (Claude Code adds this automatically when you commit through it).

### Branches & PRs

- Branch off `main`. Short kebab-case names: `feat/podcast-player`, `fix/lenis-cleanup`.
- PRs must fill in `.github/pull_request_template.md`. The template auto-prompts about ADRs and design-system changes.
- Non-trivial architectural choices require a linked ADR (`Proposed` during review → `Accepted` on merge). See [`docs/adr/README.md`](./docs/adr/README.md) for "when to write one."

### Pre-commit / pre-push

- `pnpm typecheck` must pass.
- `pnpm dev` must boot and the affected pages must render visually correct.
- No leftover `console.log` in committed code (except inside `.claude/`).

### Local dev

```powershell
pnpm install
pnpm dev               # http://localhost:3000 (admin at /admin)
pnpm typecheck         # tsc --noEmit
pnpm build             # next build (Turbopack)
pnpm generate:types    # regenerate src/payload-types.ts after Payload config changes
pnpm generate:importmap
```

`.env.local` (gitignored) needs `PAYLOAD_SECRET` and `DATABASE_URI`. Copy from `.env.example`. The `DATABASE_URI` is a MongoDB Atlas connection string — provisioned on the SOTER org account (ask Civan).

Personal Claude settings can go in `.claude/settings.local.json` (gitignored). Shared team settings go in `.claude/settings.json` (committed).

---

## Architecture overview

**Component library + centralized animation tokens + isolated design system.** Three layers, each with a clear contract.

### Components (`src/components/<Name>/`)

29 components, each self-contained:
- `<Name>.tsx` — the React component
- `<Name>.module.css` — styles (CSS Module, scoped automatically)

Props always take `bgColor`, `textColor`, `accentColor` (etc.) as optional overrides — see `src/shared/colors.ts` and `src/shared/modes.ts`. Components must never hardcode brand colors or company names.

### Animations (`src/shared/animations.ts`)

Every duration, easing, distance, stagger, scrub flag, and ScrollTrigger start position lives in this one file as a named token in the `ANIM` object. **Call sites import the token; they never inline values.** Tweaking the entire site's motion language is one file, one PR.

When adding new animation, add a new token to `animations.ts` first, then reference it from the call site.

### Design system (the protected layer)

The design system is **explicitly isolated** so customer rebrands (ADR-0003) only need to swap a small set of files. See [ADR-0005](./docs/adr/0005-design-system-isolated-layer.md) for the full contract.

**The design-system layer = these files only:**
- `src/shared/tokens.css` — all CSS custom properties
- `src/shared/animations.ts` — all motion tokens
- `src/shared/colors.ts`, `src/shared/modes.ts` — typed helpers
- `/public/brand/*` — brand assets

**Hard rules (enforced by review and the `code-reviewer` agent):**
1. Component CSS files (`*.module.css`) MUST use `var(--token)` — **never raw hex** (`#xxx`), raw rgb/hsl, named CSS colors, or font-family strings.
2. Component TSX files MUST NOT contain hardcoded brand strings (`"SOTER"`, contact info, social URLs). Until Payload Globals ship, those live in a single constants file.
3. **AI skills (`ui-ux-pro-max` and similar) supply layout and structure; the design system supplies tokens.** The flow is "skill produces structure → we apply our tokens" — never "skill produces tokens → we adopt them."
4. New tokens (colors, spacing steps, font additions) require an ADR. Trivial uses of existing tokens do not.

If you're tempted to write `color: #D6FF5C`, stop. Find the token. If it doesn't exist, that's an ADR conversation.

---

## Code patterns

### Lenis + GSAP RAF sync

Lenis owns scroll. GSAP's ScrollTrigger must be RAF-synced or you get jank and stale trigger positions. The integration is non-negotiable:

```ts
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ /* … */ });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

See `src/preview/SmoothScroll.tsx` for the current implementation.

### ScrollTrigger + matchMedia + reduced-motion

Every ScrollTrigger setup wraps in `gsap.matchMedia` and gates on `(prefers-reduced-motion: no-preference)`. No exceptions. Users with reduced-motion get the static version of the page.

```ts
const mm = gsap.matchMedia();
mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
  // animation setup
  return () => { /* cleanup */ };
});
```

### useGSAP for React

Use `@gsap/react`'s `useGSAP` hook with a scope ref. Never `useEffect(() => { gsap.to(...); }, [])` directly — `useGSAP` handles cleanup and StrictMode double-mount correctly.

### Arrow buttons

Any button with a forward-arrow uses `<ArrowIcon />` + `data-arrow-text` on the label span + the `useArrowDrawHover(ref)` hook. The hook reads `ANIM.arrowHover` from `animations.ts`. See `src/components/HeroPage/HeroPage.tsx` for a reference implementation.

### Page content lives in Payload, blocks render it

Site pages (everything except `/admin`, `/component-library`) are driven by either the `pages` or `posts` collection. Each document has a blocks-based content field composed in the admin.

**Two block palettes, separate concerns:**

- `ALL_BLOCKS` (`src/blocks/index.ts`) — page-layout blocks used by Pages `layout` field: HeroPage, Intro, ProblemList, ProcessSteps, OverviewCards, Cases, AuditPreview, Calendly, CtaBlock, Chapter (the only block that nests other blocks).
- `ALL_PROSE_BLOCKS` — prose-level blocks used by Posts `body` field: ProseParagraph, ProseHeading, ProseList, ProsePullQuote, ProseCallout. Rendered by `src/blocks/ProseBlocks.tsx` into `<BlogPostArticle>`'s children slot.

**Adding a new component to a palette:** write `src/blocks/<Name>.block.ts` exporting a `Block`, register it in `src/blocks/index.ts` (in the appropriate `ALL_BLOCKS` / `ALL_PROSE_BLOCKS` array), and add a `case '<slug>':` to the right dispatcher (`Blocks.tsx` or `ProseBlocks.tsx`).

**Routes:**
- `/<slug>` (`src/app/(site)/[slug]/page.tsx`) resolves to a Pages doc — used for `/startups` and (future) any marketing page
- `/article/<slug>` (`src/app/(site)/article/[slug]/page.tsx`) resolves to a Posts doc
- Explicit routes (`/`, `/component-library`) bypass the catch-alls

**Site chrome (Navigation, Footer):** `src/app/(site)/_chrome/SiteChrome.tsx` is an async server component reading `Navigation` and `Footer` Globals from Payload. To edit nav/footer, use `/admin → Globals`. See ADR-0010.

**Seed:** `pnpm seed` upserts the home Pages doc, the `/startups` Pages doc, both Globals, and the two existing Posts. Idempotent (re-running overwrites). Bootstrap-only — don't run after editorial work has happened in admin.

See ADR-0008 (page blocks), ADR-0009 (component prop widening for CMS media), ADR-0010 (Posts + ProseBlocks + Globals).

### Route groups own their own `<html><body>`

There is **no `src/app/layout.tsx`** in this repo. Each route group renders its own document shell:

- `src/app/(site)/layout.tsx` — `<html lang="de">` + `<body>` + next/font + `globals.css` + `<SmoothScroll>` wrapper. Applies to `/`, `/startups`, `/article`, `/article-mvp`.
- `src/app/(payload)/layout.tsx` — uses Payload's `RootLayout` from `@payloadcms/next/layouts`, which renders its own `<html lang="en">` + `<body>` + admin styles.

Do **not** add a `src/app/layout.tsx` with `<html><body>` — Payload's `RootLayout` will then nest inside ours and you get hydration errors (`<html> cannot be a child of <body>`, etc.). This is the pattern from Payload's own `blank` template.

### CSS Module imports

Use `import styles from "./X.module.css"` (default import). The Vite-era namespace import (`import * as styles from ...`) was bulk-converted during the Next 16 migration — Next's SWC pipeline expects default imports. If you copy-paste old examples, convert them.

---

## Folder map

```
.
├── CLAUDE.md                           This file
├── README.md                           Stack overview + setup + roadmap
├── next.config.ts                      Next + withPayload wrapper
├── .claude/                            agents, commands, skills (ui-ux-pro-max)
├── .github/pull_request_template.md
├── docs/adr/                           Architecture Decision Records
├── src/
│   ├── app/
│   │   ├── globals.css                 Global resets + osmo viewport scaling
│   │   ├── (site)/                     SOTER site routes (each group owns its <html><body>)
│   │   │   ├── layout.tsx              <html><body> + fonts + SmoothScroll wrapper
│   │   │   ├── page.tsx                → / (homepage — Pages doc 'home' or placeholder)
│   │   │   ├── [slug]/page.tsx         → /<slug> catch-all (Pages collection lookup)
│   │   │   ├── component-library/      → /component-library (legacy preview, design-system reference)
│   │   │   ├── article/[slug]/page.tsx → /article/<slug> (Posts collection lookup)
│   │   │   └── _chrome/SiteChrome.tsx  async server component — reads Navigation + Footer Globals
│   │   └── (payload)/                  Payload admin + API (auto-generated)
│   │       ├── layout.tsx
│   │       ├── admin/[[...segments]]/  Admin UI
│   │       └── api/                    REST / graphql / graphql-playground
│   ├── blocks/                         Block palettes — Payload field schemas + render dispatchers
│   │   ├── <Name>.block.ts             Page-layout blocks (ADR-0008)
│   │   ├── Prose<Name>.block.ts        Prose-level blocks for Post bodies (ADR-0010)
│   │   ├── index.ts                    ALL_BLOCKS + ALL_PROSE_BLOCKS registries
│   │   ├── Blocks.tsx                  'use client' page-layout dispatcher
│   │   └── ProseBlocks.tsx             'use client' prose-level dispatcher (for Post body)
│   ├── collections/                    Payload collections (Users, Media, Pages, Posts)
│   ├── globals/                        Payload Globals (Navigation, Footer)
│   ├── posts/PostRenderer.tsx          Wraps BlogPostArticle with Post fields + ProseBlocks
│   ├── components/<Name>/              29 components + CSS modules
│   ├── preview/                        Route content (likely moves under (site)/ later)
│   │   ├── App.tsx                     ComponentLibrary (default export)
│   │   ├── SmoothScroll.tsx            Lenis + GSAP RAF sync ('use client')
│   │   └── pages/                      StartupsLanding, BlogArticleLanding, BlogArticleMvp
│   ├── preview/                        Legacy preview content (ComponentLibrary only now)
│   │   ├── App.tsx                     ComponentLibrary (default export for /component-library)
│   │   └── SmoothScroll.tsx            Lenis + GSAP RAF sync ('use client')
│   ├── shared/
│   │   ├── tokens.css                  ── design system (ADR-0005)
│   │   ├── animations.ts               ──
│   │   ├── colors.ts, modes.ts         ──
│   │   ├── useArrowDrawHover.ts        Arrow-draw hover hook
│   │   ├── extractText.ts              JSON prop helpers
│   │   ├── resolveMedia.ts             string | MediaDoc resolver (ADR-0009)
│   │   └── posthog.ts                  Analytics init
│   ├── payload.config.ts               Payload config (Mongo, collections, S3 conditional)
│   └── payload-types.ts                Generated by `pnpm generate:types` (gitignored)
scripts/
  └── seed.ts                           Bootstraps /startups Pages document
public/
  ├── assets/                           Page-shared images
  └── brand/                            ── design system (logo, favicon, OG defaults)
```

---

## AI collaboration rules

These apply to Claude Code (and any other AI assistant) working in this repo. They are not preferences — they are the contract.

### Read first, write second

Before making non-trivial changes, Claude must:

1. Read this `CLAUDE.md`.
2. Read `docs/adr/README.md` and any ADRs touching the change area.
3. Read the README to understand the phase context.

Only then propose a plan. Don't start implementing architecture that contradicts an Accepted ADR. If you think an ADR should change, write a new ADR (or propose superseding the old one) — don't silently work around it.

### Never invent verifiable facts

Never fabricate enum values, function signatures, schema fields, API shapes, or library APIs. If a fact is checkable by reading a file, running a command, or fetching a doc, **check it before using it**. A plausible-but-wrong value is worse than asking.

This applies especially to code that ships, configs that target real systems, and values that go into prompts or payloads. Reasoning under stated uncertainty ("I'd default to X because Y, but verify Z") is fine — fabricating concrete answers is not.

### Propose ADR for non-trivial decisions

If a change involves picking between libraries, redrawing an architectural boundary, or constraining future work — pause and propose an ADR before writing code. Use `/adr-new "<title>"` to scaffold. The agent `adr-writer` can draft the body from session context.

If you're unsure whether something needs an ADR: ask the user, or err on the side of writing one. The cost of an unnecessary ADR is 10 minutes; the cost of a missing one is days of confusion later.

### Respect the design-system contract

When generating component code (yourself or via skills): use existing tokens from `src/shared/tokens.css` and `src/shared/animations.ts`. Never inline hex, rgb, raw px, or font-family strings in component files. If you genuinely need a value that doesn't have a token, surface that to the user — don't invent a hardcoded value.

When invoking skills like `ui-ux-pro-max` for layout suggestions: extract the structural patterns and the spacing logic, but always replace generated colors/fonts/raw values with our tokens before writing files. See [ADR-0005](./docs/adr/0005-design-system-isolated-layer.md).

### Keep scope tight

A bug fix doesn't need surrounding cleanup. A one-shot operation doesn't need a helper. Three similar lines is better than a premature abstraction. Don't add error handling, fallbacks, or validation for scenarios that can't happen — trust internal code and framework guarantees, validate only at system boundaries.

### No drive-by file creation

Never create planning, decision, or analysis files unless the user asks for them. Work from conversation context, ADRs, and CLAUDE.md — not from intermediate scratch documents. The exception is genuine artifacts the user requested (new ADRs, new components, new tests).

---

## Pointers

- **Architectural decisions:** [`docs/adr/`](./docs/adr/README.md) — read first, propose new ones as needed.
- **Phase roadmap:** [`README.md`](./README.md#roadmap).
- **Animation tokens:** `src/shared/animations.ts` — single source of motion truth.
- **Design tokens:** `src/shared/tokens.css` — single source of color/typography/spacing.
- **Slash commands:** `/adr-new`, `/adr-list`, `/adr-supersede` (see `.claude/commands/`).
- **Agents:** `adr-writer`, `code-reviewer` (see `.claude/agents/`).
- **Skills:** `ui-ux-pro-max` (committed at `.claude/skills/ui-ux-pro-max/`). Generates layout patterns — pair with the design-system contract above.
