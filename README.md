# Parpali website

Restaurant website for **Parpali** — italienische und internationale Küche. Online table booking with live availability, CMS-managed menu, gallery, events. Built on **Next.js 16 + Payload 3 CMS**, forked from the [`soter-website-payload`](https://github.com/soter-studio/soter-website-payload) baseline (ADR-0003 makes it forkable).

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Payload 3** CMS, in-process via `@payloadcms/next`
- **MongoDB Atlas** via `@payloadcms/db-mongodb` — own database `parpali` on the Soter cluster
- **Hetzner Object Storage** (S3-compatible) for Media — bucket `parpali-media`
- **Resend** for transactional email (reservation confirmations)
- **GSAP 3.15** + **Lenis 1.3** smooth scroll (RAF-synced — see CLAUDE.md)
- **CSS Modules** + design tokens in `src/shared/tokens.css`
- **next/font**: Playfair Display SC (display) + Karla (body) + Space Mono (tabular)
- **pnpm** as package manager

## Setup

```bash
pnpm install
pnpm dev               # http://localhost:3000  (admin at /admin)
pnpm typecheck
pnpm build
pnpm generate:types    # regenerate src/payload-types.ts after Payload config changes
pnpm generate:importmap
pnpm seed              # bootstrap Globals + a few example MenuItems + a Testimonial
```

Copy `.env.example` → `.env.local` and fill in:

```
PAYLOAD_SECRET=<openssl rand -hex 32>
DATABASE_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/parpali
RESEND_API_KEY=re_…              # optional in dev (sends are no-op'd without it)
RESEND_FROM_EMAIL=Parpali <noreply@parpali.de>
NEXT_PUBLIC_SITE_URL=https://parpali.de

# Optional in dev — when set, Media uploads route to Hetzner instead of /media/
S3_BUCKET=parpali-media
S3_ACCESS_KEY_ID=…
S3_SECRET_ACCESS_KEY=…
S3_ENDPOINT=https://hel1.your-objectstorage.com
S3_REGION=hel1
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Homepage — Pages doc with `slug=home`, otherwise placeholder |
| `/<slug>` | Any Pages document (used for `/galerie`, `/ueber-uns`, `/kontakt`, `/events`, `/impressum`, `/datenschutz` once they exist in the CMS) |
| `/menu` | Speisekarte — server-rendered from MenuItems collection, grouped by category |
| `/reservierung` | Online booking — 3-step form posting to `/api/reservations` |
| `/admin` | Payload admin (first hit prompts to create the admin user) |
| `/api/availability?date=YYYY-MM-DD&partySize=N` | Returns open slots for the date and party size |
| `/api/reservations` (POST) | Creates a reservation, sends confirmation email |
| `/api/[...slug]` | Payload REST |

## Payload schema

**Collections** — `users`, `media`, `pages`, `menu-items`, `reservations`, `inquiries`, `testimonials`, `events`.
**Globals** — `navigation`, `footer`, `opening-hours`, `booking-settings`, `contact-info`.
**Localization** — `de` (default) + `en`. Localized fields are flagged on Pages, MenuItems, Testimonials, Events, Navigation labels, Footer text, BookingSettings copy.
**Block palette** — Pages `layout` field accepts: `HeroPage`, `Intro`, `CtaBlock`, `Chapter` (Chapter nests `Intro` and `CtaBlock`).

## Booking system

Slot logic lives in `src/lib/availability.ts` as pure functions — no I/O — so it's straightforward to unit-test. The API routes (`src/app/api/availability/route.ts` and `src/app/api/reservations/route.ts`) load the `BookingSettings` and `OpeningHours` globals plus existing reservations for the date and pass them to `getOpenSlots()`. The booking form (`src/components/BookingForm/`) is the only client component in the flow; everything else is server-rendered.

Reservations write through `overrideAccess: true` because the public REST `create` access is denied — only authenticated admins can read or modify them through `/admin`.

## Design system (inherited contract — ADR-0005)

The design-system layer is intentionally isolated to a small set of files:

- `src/shared/tokens.css` — CSS custom properties (colors, radius, space, typography)
- `src/shared/animations.ts` — GSAP/motion tokens
- `src/shared/colors.ts`, `src/shared/modes.ts` — section helpers
- `/public/brand/*` — brand assets

Component CSS files MUST use `var(--token)` — never raw hex. See `CLAUDE.md` for the full contract.

## Deployment

GitHub Actions builds the Docker image and pushes to GHCR, then SSHs into the Hostinger VPS and runs `docker compose pull && docker compose up -d`. The container joins the `traefik` network on the VPS; Traefik handles TLS via Let's Encrypt and routes `parpali.de` (and `www.parpali.de` → apex) to port 3000.

Required GitHub Actions secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`. The runtime `.env` on the VPS at `/srv/parpali-website/.env` holds `PAYLOAD_SECRET`, `DATABASE_URI`, `S3_*`, `RESEND_API_KEY`.

## Folder layout

```
src/
  app/
    globals.css                 Global resets + viewport scaling
    (site)/
      layout.tsx                <html><body> + fonts + SmoothScroll
      page.tsx                  → / (Pages 'home' or placeholder)
      [slug]/page.tsx           → /<slug> (Pages collection)
      menu/page.tsx             → /menu (MenuItems collection)
      reservierung/page.tsx     → /reservierung (uses BookingForm)
      _chrome/SiteChrome.tsx    Reads Navigation + Footer Globals
    (payload)/                  Admin + REST + GraphQL (auto-generated)
    api/
      availability/route.ts     GET — open slots for date + party size
      reservations/route.ts     POST — validates + creates + emails
  collections/                  Users, Media, Pages, MenuItems,
                                Reservations, Inquiries, Testimonials, Events
  globals/                      Navigation, Footer, OpeningHours,
                                BookingSettings, ContactInfo
  components/                   HeroPage, Intro, Chapter, CtaBlock, ArrowIcon,
                                ContactForm, DotRow, SectionEyebrow, SiteHeader,
                                SiteFooter, BookingForm, MenuList
  blocks/                       HeroPage, Intro, CtaBlock, Chapter + dispatcher
  lib/
    availability.ts             Pure slot-logic functions
    email.ts                    Resend wrapper + reservation HTML
  shared/                       Design system tokens + animation tokens
  payload.config.ts             Payload config (collections, globals, localization, S3)
scripts/
  seed.ts                       Bootstrap Globals + Speisekarte (idempotent)
public/brand/                   Brand assets
```

## Roadmap (from /Users/admin/.claude/plans/gleaming-drifting-crystal.md)

- [x] **Phase 1** — Fork baseline, swap design tokens & fonts, Parpali brand identity
- [x] **Phase 2** — Payload schema (MenuItems, Reservations, Inquiries, Testimonials, Events + Globals); localization
- [x] **Phase 3** — Booking system (availability lib, API routes, BookingForm component, email)
- [ ] **Phase 4** — Remaining pages (about, gallery, contact, events), Parpali-specific blocks (TodaysSpecial, MenuPreview, ReservationCTA, TestimonialCarousel), GSAP polish, SVG illustrations
- [ ] **Phase 5** — Next.js i18n routing, Hetzner S3 bucket, MongoDB database, VPS provisioning, DNS cutover, client CMS training

## Notes inherited from baseline

The baseline `CLAUDE.md` and ADRs are kept verbatim — they describe inherited patterns that still apply (Lenis + GSAP RAF sync, route-group layouts owning their own `<html><body>`, the design-system contract). The Parpali-specific addendum is at the top of `CLAUDE.md`.
