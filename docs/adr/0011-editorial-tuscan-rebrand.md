# 0011 · Editorial Tuscan rebrand (v3) — Cypress palette, Fraunces, mode toggle

- **Status:** Accepted
- **Date:** 2026-05-19
- **Supersedes:** none in this repo (this is the v3 sibling repo; v2's ADR-0011 documents the minimalist Bacasime/Oak-Stone-Clay direction)

## Context

This repo (`parpali-website-v3`) is the third Parpali design variant, sitting next to v1 (warm-editorial; archived in `parpali-website-v1/`) and v2 (minimalist; the `parpali-website/` sibling). The client asked for a fully separate third proposal so all three can be compared side by side. The brief:

- A different design direction than the first two — magazine / editorial Tuscan.
- Different fonts than v1 (Playfair + Karla) and v2 (Bacasime + Inter).
- A different palette than v2's Oak / Stone / Clay.
- More expressive animation density.
- A real Tuscan-feel hero (olive grove + cypress trees).
- A more compact menu (less scrolling).
- More whitespace, especially on Kontakt.

## Decision

### Cypress palette in two cinematic modes

- **Light mode (default)**: ivory `#f5f0e4` bg / cypress `#1f2e1f` text / saffron `#c28b2c` accent.
- **Dark mode**: deep cypress `#15201a` bg / warm ivory `#f2ebda` text / brighter saffron `#e8b355` accent.

Same eight semantic vars (`--bg`, `--bg-elev`, `--bg-inverse`, `--fg`, `--fg-2`, `--fg-3`, `--accent`, `--accent-fg`, `--accent-hover`, `--border`, `--border-strong`, `--focus-ring`) — pure mode swap, no palette family. Switching via `data-mode="light|dark"` on `<html>`, persisted in `localStorage.parpaliMode`. Smooth 280 ms transition on `:root` (no-op under reduced-motion).

Both modes verified WCAG AA for body text on backgrounds.

### Fonts: Fraunces + Manrope + Space Mono

- **Fraunces** (variable, optical-sized, true Italic) — display + logo wordmark; used in italic at hero for the "Parpali" mark, normal-style for h1/h2.
- **Manrope** (variable Sans, very readable) — body, UI, h3+.
- **Space Mono** — tabular figures for prices on the menu and time displays.

All loaded via `next/font/google` with `display: 'swap'`, exposed as `--font-fraunces`, `--font-manrope`, `--font-space-mono`. The aliases `--font-display`, `--font-sans`, `--font-mono` in `tokens.css` point at these.

### Animation tokens

Five new tokens in `src/shared/animations.ts` (`parallax`, `letterStagger`, `marquee`, `clipReveal`, `magnetic`, `floatingCta`) drive the new visual language: parallax hero, letter-staggered title reveal, infinite marquee strips, clip-path image reveals on scroll, magnetic CTA hover, floating reserve-CTA after hero scroll. All gated through `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`.

### Mode toggle replaces palette switcher

`ModeSwitcher` (sun/moon two-state) replaces v2's three-swatch `PaletteSwitcher`. Same architectural pattern (data-attribute on `<html>` + localStorage), simpler UX appropriate for editorial design (binary day/night ambiance rather than palette choice).

## Consequences

- v3 is independently deployable as `parpali-website-v3` (own GHCR image, own Traefik host). MongoDB cluster is shared with v1/v2 (same Atlas instance) — both sites show identical CMS data.
- Component CSS reads only semantic vars (`var(--bg)`, `var(--fg)`, `var(--accent)`); mode swap has zero per-component changes.
- Legacy `--parpali-*` brand vars are kept in `tokens.css` for back-compat with copied components that haven't been migrated.

## Out of scope

- A third "season" palette (autumn/spring) — possible by adding another `[data-mode="..."]` block.
- Auto-mode (`prefers-color-scheme`) — manual toggle only, intentional editorial choice.
- Per-page mode overrides — not needed.
