# ADR-0010: Posts Collection, ProseBlocks for Body, Navigation + Footer Globals

## Status
Proposed (2026-05-14) — extends [ADR-0008](./0008-blocks-pipeline-and-pages-posts-collections.md)

## Context
[ADR-0008](./0008-blocks-pipeline-and-pages-posts-collections.md) sketched the Posts-collection shape but deferred the implementation. This ADR specifies the concrete schema, the body-content model (ProseBlocks vs. Lexical richtext), and the Navigation/Footer Globals that replace the hardcoded chrome data in `SiteChrome.tsx`.

The decisions here interact:
- How is article body modelled (Lexical richtext vs. nested Blocks)?
- How are header/footer link sets edited (Payload Globals)?
- How does the `<BlogPostArticle>` component layer consume Posts data (prop widening per ADR-0009)?
- What gets seeded vs. authored in the admin?

## Decision

### 1. Posts collection (`src/collections/Posts.ts`)

A standard Payload collection, drafts enabled with autosave, ~30 fields grouped semantically:

```ts
{
  slug: 'posts',
  versions: { drafts: { autosave: { interval: 100 } } },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'publishedAt', '_status'] },
  fields: [
    // Identity
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'select', required: true, options: ['Praxis', 'Strategie', 'Technik', 'Insights'] },
    { name: 'dek', type: 'textarea' },
    { name: 'publishedAt', type: 'date' },

    // Crumbs (Header)
    { name: 'crumbsBack', type: 'text', defaultValue: 'Journal' },
    { name: 'crumbsBackHref', type: 'text', defaultValue: '/article' },
    { name: 'crumbsMeta', type: 'text' },

    // Hero
    { name: 'hero', type: 'upload', relationTo: 'media' },
    { name: 'heroCaption', type: 'text' },

    // Author (inline; not a Users relation yet)
    { name: 'authorInitials', type: 'text' },
    { name: 'authorName', type: 'text' },
    { name: 'authorRole', type: 'text' },
    { name: 'authorEyebrow', type: 'text', defaultValue: 'Autor' },
    { name: 'authorBody', type: 'textarea' },
    { name: 'authorLinks', type: 'array', fields: [{ name: 'label', type: 'text' }, { name: 'href', type: 'text' }] },

    // Byline
    { name: 'bylineStats', type: 'array', fields: [{ name: 'text', type: 'text' }] },

    // TOC + Share
    { name: 'tocEyebrow', type: 'text', defaultValue: 'Inhalt' },
    { name: 'toc', type: 'array', fields: [
      { name: 'id', type: 'text', required: true },
      { name: 'num', type: 'text', required: true },
      { name: 'title', type: 'text', required: true },
    ]},
    { name: 'shareEyebrow', type: 'text', defaultValue: 'Teilen' },
    { name: 'shareLinks', type: 'array', fields: [{ name: 'label', type: 'text' }, { name: 'href', type: 'text' }] },

    // Podcast (optional)
    { name: 'podcast', type: 'group', fields: [
      { name: 'enabled', type: 'checkbox', defaultValue: false },
      { name: 'src', type: 'text' },
      { name: 'title', type: 'text' },
      { name: 'meta', type: 'text' },
    ]},

    // Body — composed of ProseBlocks
    { name: 'body', type: 'blocks', required: true, minRows: 1, blocks: ALL_PROSE_BLOCKS },

    // Related
    { name: 'relatedEyebrowNum', type: 'text', defaultValue: '/05' },
    { name: 'relatedEyebrowLabel', type: 'text', defaultValue: 'Weiterlesen' },
    { name: 'relatedHeading', type: 'text', defaultValue: 'Drei Texte, die dazu passen.' },
    { name: 'related', type: 'relationship', relationTo: 'posts', hasMany: true, maxRows: 3 },

    // SEO
    { name: 'seo', type: 'group', fields: [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'ogImage', type: 'upload', relationTo: 'media' },
    ]},
  ],
}
```

### 2. ProseBlocks for body content

Five prose-level blocks live in `src/blocks/Prose*.block.ts`:

| Block | Fields | Renders |
|---|---|---|
| `prose-paragraph` | `text` (textarea), `lead` (checkbox), `dropcap` (text, single letter), `id` (text optional) | `<p id={id?} className={lead ? 'lead' : ''}>` with optional `<span className="dropcap">{dropcap}</span>` prefix |
| `prose-heading` | `level` ('h2'\|'h3'), `num` (text), `id` (text), `text` (text) | `<hN id={id}><span className="h-num mono">{num}</span>{text}</hN>` |
| `prose-list` | `items[]` of `{ strong, text }` | `<ul className="prose-list">` with `<li>{strong && <strong>{strong}</strong>} {text}</li>` |
| `prose-pullquote` | `text` (textarea), `cite` (text) | `<blockquote className="pull-quote">` with mark span + p + cite |
| `prose-callout` | `strong`, `text`, `linkLabel`, `linkHref` | `<p className="ba-callout"><strong>{strong}</strong> {text} <a href={linkHref}>{linkLabel}</a></p>` |

A `<ProseBlocks>` dispatcher (cousin of the page-level `<Blocks>`) in `src/blocks/ProseBlocks.tsx` translates the array to JSX. It is `'use client'` because the consuming `<BlogPostArticle>` already uses client hooks.

ProseBlocks are added to `ALL_PROSE_BLOCKS` in `src/blocks/index.ts` — a separate registry from `ALL_BLOCKS` (which is for page-layout) so the two block palettes don't pollute each other in the admin UI.

### 3. Why ProseBlocks and not Lexical

Payload's recommended richtext for article bodies is Lexical. We rejected it for now:

- The existing `BlogPostArticle` component renders very specific CSS-classed structures (`.lead`, `.dropcap`, `.h-num.mono`, `.prose-list`, `.pull-quote`, `.pq-mark`, `.ba-callout`) baked into `BlogPostArticle.module.css`. Producing exactly those structures from Lexical requires custom node types and a custom renderer — a non-trivial amount of code to write before any content can exist.
- Seeding two articles' worth of content requires authoring Lexical's nested-JSON state by hand. Each paragraph is `{ children: [{ text: '...', type: 'text' }], type: 'paragraph', ... }`. Tedious and error-prone for the bootstrap.
- ProseBlocks gives editors a structured palette ("add paragraph", "add heading", "add pull-quote") that's harder to misuse than a free-form richtext editor.

A future ADR can supersede this with Lexical if editor ergonomics become the bottleneck. The migration cost is: write a Lexical-to-ProseBlocks (or vice versa) converter once.

### 4. Navigation + Footer Globals

Two Payload Globals replace the hardcoded `NAV_LINKS` / `FOOTER_COLS` arrays in `src/app/(site)/_chrome/SiteChrome.tsx`:

```ts
// src/globals/Navigation.ts
{
  slug: 'navigation',
  fields: [
    { name: 'brandText', type: 'text', defaultValue: 'SOTER' },
    { name: 'brandHref', type: 'text', defaultValue: '/' },
    { name: 'links', type: 'array', fields: [
      { name: 'label', type: 'text', required: true },
      { name: 'href', type: 'text', required: true },
    ]},
    { name: 'ctaText', type: 'text', defaultValue: 'Use Case besprechen' },
    { name: 'ctaHref', type: 'text', defaultValue: '/kontakt' },
  ],
}

// src/globals/Footer.ts
{
  slug: 'footer',
  fields: [
    { name: 'brandText', type: 'text', defaultValue: 'SOTER' },
    { name: 'mode', type: 'select', options: ['dark', 'light'], defaultValue: 'dark' },
    { name: 'columns', type: 'array', fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'links', type: 'array', fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ]},
    ]},
    { name: 'bottomLeft', type: 'text' },
    { name: 'bottomRight', type: 'text' },
  ],
}
```

`SiteChrome.tsx` becomes an async server component that calls `payload.findGlobal({ slug })` for both and renders them via the existing `<SiteHeader>` / `<SiteFooter>` React components.

### 5. Route layout

- `src/app/(site)/article/[slug]/page.tsx` — dynamic; fetches Posts collection by slug
- `src/app/(site)/article/page.tsx` — **removed**. `/article` without a slug returns 404. A future blog-index page can reintroduce this route.
- `src/app/(site)/article-mvp/page.tsx` — **removed**. Becomes `/article/mvp-fehler`.

### 6. Seed strategy

`scripts/seed.ts` extended to upsert (idempotent):
- Navigation + Footer Globals (current hardcoded values)
- `home` Pages doc — minimal HeroPage "Coming soon"
- `pitch-zur-production` Post — extracted from `BlogArticleLanding.tsx`
- `mvp-fehler` Post — extracted from `BlogArticleMvp.tsx`
- Cross-link: each Post lists the other in its `related` field

The seed is a **bootstrap**, not a content-management tool. Re-running overwrites admin edits.

## Consequences

+ All visible site pages are now CMS-editable: `/`, `/startups`, `/article/*`. The component-library reference page (`/component-library`) intentionally stays static.
+ Navigation and footer edit-once-update-everywhere via Globals.
+ ProseBlocks gives editors a structured (= constrained) article authoring UX — fewer ways to break the design.
+ Seed-driven fork-template story (ADR-0003) becomes more complete: a fresh fork runs `pnpm seed` and has a fully-populated demo site.
- ProseBlocks is more verbose to author than free-form richtext. If editors find this annoying, that's the trigger to revisit with Lexical.
- Inline rich content (bold, italic, links inside a paragraph) is not modelled. The seed flattens any inline `<strong>` in body paragraphs to plain text. Lists and callouts have dedicated bold-prefix fields; paragraphs do not.
- Two article-route Page components (`/article`, `/article-mvp`) become dead — replaced by `/article/[slug]`. URL break is acceptable pre-launch.
- Page-level GSAP animations in `BlogArticleLanding.tsx` / `BlogArticleMvp.tsx` disappear with the files (top scroll-progress bar, header reveal stagger, hero parallax, prose reveals, pull-quote accent, author block reveal, related cards stagger). Component-level animations stay. Future `<PageAnimations>` abstraction (deferred PR) can restore these against `data-*` selectors on rendered blocks.

## Alternatives Considered

- **Lexical richtext for `body`.** Rejected for the seed-cost and CSS-class-fidelity reasons above. Revisit if/when authoring ergonomics matter more than seed simplicity.
- **Posts inside `pages` with a `type: 'post'` discriminator.** Rejected — bleeds blog-specific fields (TOC, related, dek, podcast) into the generic Pages schema. Two collections cleanly separate concerns.
- **Author as a Users relation.** Considered. Rejected for now: requires adding `displayName`, `role`, `bio`, `links` to the Users collection and a back-reference. Worth doing when we have more than two authors; inline is fine until then.
- **Navigation / Footer as Pages-doc-fields instead of Globals.** Rejected — they're site-wide, not per-page. Globals is the right Payload primitive.

## Revisit When

- Editor ergonomics with ProseBlocks become a complaint (then: Lexical migration)
- Authors collection grows beyond ~3 people (then: extract Authors to a relation)
- A different site section (e.g., careers, newsletter archive) needs a similar shape (then: parameterize the pattern, or extend Posts with categorization)
- Globals get more complex (e.g., footer needs localization fields per region) — Payload supports localization; we'd extend then
