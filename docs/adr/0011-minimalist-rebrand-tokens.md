# 0011 · Minimalist rebrand — palette layers + font swap

- **Status:** Accepted
- **Date:** 2026-05-19
- **Supersedes:** none (extends ADR-0005)

## Context

After the first round of Parpali design (warm-editorial: deep restaurant red, Playfair Display SC small-caps, drop-caps, olive-branch SVG flourishes) the client asked for the opposite direction — **minimalist, calm, natural**, with a recurring central reservation CTA, an olive-grove hero, FAQ, map, and the ability to demo **multiple color palettes** to land on a final one.

ADR-0005 isolates the design system to `src/shared/tokens.css` + `src/shared/animations.ts` + `src/shared/colors.ts|modes.ts` so customer rebrands only touch that layer. Component CSS must read `var(--token)` and must never hardcode hex or font-family. To support live palette switching without rewriting every component, we extend the semantic-token layer with **palette overrides keyed off `data-palette` on `<html>`**, and swap the display + body fonts in `src/app/(site)/layout.tsx`.

## Decision

### Palette layers

`tokens.css` defines three palette layers — **Oak (default), Stone, Clay**. Each overrides the same eight semantic vars: `--bg`, `--bg-elev`, `--bg-inverse`, `--fg`, `--fg-2`, `--fg-3`, `--accent`, `--accent-fg`, `--accent-hover`, `--border`, `--border-strong`, `--focus-ring`.

```css
:root                          /* = Oak (default — warm wood)   */
:root[data-palette="stone"]    /* cool grey / sage              */
:root[data-palette="clay"]     /* terracotta / burnt-orange     */
```

All eight pairs verified WCAG AA for body text on background. `--section-*` aliases are derived from the palette vars so legacy components that read `--section-bg` / `--section-text` etc. automatically inherit palette changes.

Switching is performed client-side by `<PaletteSwitcher>` (`src/components/PaletteSwitcher/`), which writes `document.documentElement.dataset.palette = 'oak|stone|clay'` and persists the choice in `localStorage.parpaliPalette`. Smooth swap via a 220 ms `transition` on `:root` (gated to no-op under `prefers-reduced-motion`).

### Font swap

- **Display:** `Bacasime Antique` (replaces Playfair Display SC) — used **only** for the logo wordmark and 1–2 hero accents.
- **Body / headlines:** `Inter` (replaces Karla) — clean geometric sans for everything else (UI, body, h1–h6).
- **Mono:** `Space Mono` (unchanged) — kept for tabular prices on the menu.

Loaded via `next/font/google` with `display: 'swap'`, exposed as `--font-bacasime`, `--font-inter`, `--font-space-mono`. The aliases `--font-display`, `--font-sans`, `--font-mono` in `tokens.css` point at these so component CSS continues to read `var(--font-sans)` etc. without change.

### Legacy `--parpali-*` vars

Kept in `tokens.css` so older components that still reference `var(--parpali-red)` or `var(--parpali-espresso)` keep rendering during the migration. New code uses the semantic vars (`--accent`, `--fg`, etc.). Components touched in this rebrand are refactored off the legacy vars; the rest follow in subsequent passes.

## Consequences

- Component CSS changes are zero for the palette swap as long as files only read semantic vars. Any file still reading `--parpali-*` will stay on the legacy values regardless of palette — we audit and migrate those during the page rebuilds.
- The `Karla` and `Playfair Display SC` Google Font imports are removed from `layout.tsx`; bundle shrinks slightly.
- The palette switcher adds one client component on the homepage / in the header — minimal JS, no SSR hydration issues because the default palette (Oak) matches the bare-`:root` styles before client hydration replays the stored choice.

## Out of scope

- A CMS-driven palette (client picks from admin). Trivial follow-up: read `Globals.SiteTheme.palette` in `<SiteChrome>` and pass through to set `data-palette` server-side.
- Per-page palette overrides — possible by writing `data-palette` on a wrapping element instead of `<html>`; not needed yet.
- Dark mode — the three palettes are light-tuned (restaurant convention). A dark variant per palette is a future ADR.
