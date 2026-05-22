# ADR-0009: Component Prop Widening for CMS-Sourced Media

## Status
Proposed (2026-05-14)

## Context
Components in `src/components/<Name>/` that accept image inputs currently type those props as `string` and render with `<img src={photoSrc} alt={...} />`. Examples: `HeroHome.photoSrc`, `BlogFeatured.coverSrc`, `BlogPostArticle.heroSrc`, `DashboardUSP` slide `src`, `CaseCard` and others.

When images come from the Media collection (via Hetzner S3 or local fallback storage), Payload returns a populated `Media` document — `{ id, url, alt, width, height, mimeType, filesize, ... }`, not a bare URL string. Two ways to handle this on the component side:

1. **Require components to always accept the `Media` shape.** Forces a refactor of every call site, including the ComponentLibrary demo route which uses hardcoded `/assets/*.png` strings. Breaks current Pattern.
2. **Widen the prop type to `string | Media`** and resolve in JSX. Preserves backwards compatibility; both legacy hardcoded usage and CMS-driven usage work.

This decision interacts with [ADR-0005](./0005-design-system-isolated-layer.md) (design-system isolation) — but only at the very edge: the prop *shape* widens to accept a CMS-data type, but the design-system invariants (no hardcoded hex, no hardcoded brand strings, tokens for everything) remain intact.

## Decision

**Image-receiving component props widen from `string` to `string | MediaDoc`, where `MediaDoc` is the shape returned by Payload's Media collection.**

The component-side resolution is a single inline branch:

```tsx
const resolvedSrc = typeof photoSrc === 'string' ? photoSrc : photoSrc?.url
// ...
<img src={resolvedSrc} alt={alt ?? (typeof photoSrc === 'object' ? photoSrc?.alt : '') ?? ''} />
```

A small helper lives in `src/shared/resolveMedia.ts` to centralise this so call sites stay tidy.

The `Media` shape is imported from Payload's generated types (`src/payload-types.ts`, produced by `pnpm generate:types`). Where that's circular or inconvenient at the component layer, a hand-written minimal type can be declared in `src/shared/media.ts`:

```ts
export type MediaDoc = {
  id: string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}
```

## Consequences

+ **No breaking changes** at call sites. ComponentLibrary keeps using `/assets/*.png` strings; Pages-driven content passes the populated Media doc.
+ **Type-safe both ways.** TS will catch any case where an image prop is missing.
+ **Alt-text fallback** — when the Media doc has an `alt` field set in the admin, components can fall back to it if no explicit `alt` prop is passed. Accessibility wins.
+ **Future-proof for `next/image`** — if/when we want to switch to `<Image src={mediaDoc} />`, the MediaDoc already carries width/height. (Out of scope for this ADR; revisit when `next/image` migration is in scope.)

- **Inline branch on every image render.** Trivial perf overhead, mild visual noise. Mitigated by `resolveMedia()` helper.
- **Mixing primitive and object shapes** in the same prop is mildly ugly. Once all images are CMS-driven and the legacy ComponentLibrary route is deprecated, the `string` form can be removed (future ADR or follow-up).
- **Component layer now imports a CMS-related type** (`MediaDoc`). This is a small boundary breach — but a documented, intentional one. The design-system contract ([ADR-0005](./0005-design-system-isolated-layer.md)) is about *colors, tokens, brand strings*, not about whether a component's image prop accepts both a URL and an object that carries a URL.

## Alternatives Considered

- **Force every call site to pass `MediaDoc`.** Rejected — breaks the ComponentLibrary route's demo data and would require either inventing fake MediaDocs or scrapping the demo route entirely.
- **Helper at every call site (`<HeroHome photoSrc={toMediaSrc(...)} />`).** Rejected — repetitive, every consumer has to remember to call it.
- **A `<MediaImage>` wrapper component that abstracts the resolution.** Considered — could replace bare `<img>` everywhere. Heavier change; pull in to a follow-up if `next/image` migration happens.
- **Generate a new "view-model" type per component** (e.g., `HeroHomeViewProps = { photoSrc: string; ... }` and a separate `HeroHomeCmsProps = { photoSrc: MediaDoc; ... }`, plus a converter). Rejected — too much ceremony for a one-line resolver.

## Revisit When

- All image-receiving components have been migrated to Media-doc-only inputs (no `string` call sites remain) — drop the union, simplify to `MediaDoc`
- We adopt `next/image` repo-wide — re-evaluate via a `<MediaImage>` wrapper that owns sizing, blur placeholders, optimization
- Payload changes the upload-result shape (unlikely in v3)
