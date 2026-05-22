# ADR-0008: Blocks Pipeline + Pages/Posts Collection Shape

## Status
Proposed (2026-05-14)

## Context
Until now, the SOTER frontend rendered hardcoded sections from `src/preview/` files (e.g. `StartupsLanding.tsx` inlined `~15` component instances with literal data). That works for a designer-prototype but not for a CMS-driven product where editors must compose pages without engineer touch.

We need a pipeline that:
1. Exposes the existing React component library (`src/components/<Name>/`) as a fixed palette of building blocks in the Payload admin
2. Drives marketing pages from a `pages` collection (one document per route, `layout` field holds a sequence of blocks)
3. Drives blog content from a `posts` collection (Lexical body + post-specific metadata)
4. Keeps the frontend rendering predictable and type-safe

The decision is non-obvious because there are several plausible places to put the block schemas, several plausible mapping strategies between Payload fields and component props, and several plausible routing strategies for "pages by slug".

## Decision

**Block schemas live as flat files under `src/blocks/<Name>.block.ts`**, each exporting a single `Block` config. A central `src/blocks/registry.ts` maps each block's `slug` to its React component (from `src/components/<Name>/`). The render dispatcher `src/blocks/Blocks.tsx` takes a `layout: BlockInstance[]` field-value and renders each block via the registry.

**Pages collection shape:**
```ts
{
  slug: 'pages',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'seo', type: 'group', fields: [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'ogImage', type: 'upload', relationTo: 'media' },
    ]},
    { name: 'layout', type: 'blocks', blocks: [/* registry */] },
  ],
  versions: { drafts: true },
}
```

**Posts collection shape** (added in a follow-up PR but specified here for coherence):
```ts
{
  slug: 'posts',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'select', options: [/* Praxis, Strategie, Technik, Insights */] },
    { name: 'dek', type: 'textarea' },
    { name: 'hero', type: 'upload', relationTo: 'media' },
    { name: 'heroCaption', type: 'text' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'publishedAt', type: 'date' },
    { name: 'body', type: 'richText' },  // Lexical
    { name: 'toc', type: 'array', fields: [
      { name: 'id', type: 'text' },
      { name: 'num', type: 'text' },
      { name: 'title', type: 'text' },
    ]},
    { name: 'related', type: 'relationship', relationTo: 'posts', hasMany: true },
  ],
  versions: { drafts: true },
}
```

**Routing strategy:**
- `src/app/(site)/page.tsx` — root; renders Pages doc with slug `home` if it exists, otherwise a minimal placeholder
- `src/app/(site)/[slug]/page.tsx` — catch-all for any Pages doc by slug (e.g., `/startups`, `/leistungen`)
- `src/app/(site)/component-library/page.tsx` — explicit, not data-driven (the legacy preview-of-all-components view)
- `src/app/(site)/article/[slug]/page.tsx` — explicit segment for Posts by slug (added in the Posts PR)

Next's resolver matches explicit routes before catch-alls; `/component-library` and `/article/*` won't get intercepted by `/[slug]`.

**Block authoring convention:**
- Block `slug` matches the kebab-cased component name (`HeroPage` → `hero-page`)
- Block fields mirror component props one-to-one where possible. Where component props expect JSX (e.g. `heading: React.ReactNode`), the block field is `type: 'text'` and the renderer wraps in a fragment.
- Arrays of structured items (e.g. `ProblemList.items`) use Payload `type: 'array'` with sub-fields.
- Images use `type: 'upload', relationTo: 'media'` and the renderer resolves the populated Media doc's `url` (see [ADR-0009](./0009-component-prop-widening-for-cms-media.md)).

## Consequences

+ **Linear cost to add a block:** one `<Name>.block.ts` file + one registry entry. New components automatically inherit the same shape pattern.
+ **Designers compose pages without engineer touch** once the block palette covers the patterns they need.
+ **Fork-friendly** (ADR-0003): customer forks inherit the entire block palette; trimming or adding is a `src/blocks/` edit.
+ **Type-safe at the boundary:** the registry is typed so a typo in `blockType` becomes a TS error.
+ **Single source of truth per page:** /startups is one Pages doc, editable from the admin, versioned via Payload drafts.

- **Tight coupling:** renaming a component prop requires updating the block schema in lockstep. Drift between TS prop types and Payload field shapes is possible. Mitigation: discipline + a future codegen step that derives Payload schemas from TS types (out of scope for now).
- **JSX-flavor content** (e.g., rich inline accents in headings) requires either flattening to plain text or using Lexical fields. We're flattening for marketing-page headings; Lexical only for post bodies.
- **Initial seed:** translating ~15 sections of /startups into structured data is one-time work. Captured in a `scripts/seed.ts` for reproducibility.

## Alternatives Considered

- **Block schemas co-located in `src/components/<Name>/`** (i.e. `src/components/HeroPage/HeroPage.block.ts`). Rejected: it bleeds CMS-layer concerns into the design-system-layer ([ADR-0005](./0005-design-system-isolated-layer.md))'s clean boundary. The flat `src/blocks/` directory keeps the two layers visibly separate.
- **Hand-crafted page components per route, no CMS.** Rejected — defeats the purpose. Even for SOTER's own site, editing copy via PR is friction we don't want.
- **MDX-based pages.** Rejected — MDX gives editors a free-form text editor but no structural blocks; you lose admin previews, drafts, and the design-system constraint. We'd be reinventing a worse Payload.
- **A single mega-block with a discriminated-union schema.** Rejected — Payload's `blocks` field type already does this efficiently; rolling our own loses the admin UX.

## Revisit When

- The block palette exceeds ~40 blocks and registry/discovery becomes painful — consider categorization or sub-groups
- A component diverges into multiple variants that don't fit a single block schema cleanly (e.g., HeroHome with a photo vs. without — currently solvable with optional fields, but watch)
- Payload introduces a richer admin block preview (e.g., live React render) — would change the cost-benefit of more granular blocks
- The Posts collection needs additional content types (newsletter issues, podcast episodes) — extend the same pattern, not a new architecture
