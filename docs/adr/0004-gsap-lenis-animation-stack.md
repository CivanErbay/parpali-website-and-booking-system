# ADR-0004: GSAP + Lenis as the Animation Stack

## Status
Accepted (2026-05-14)

## Context
The SOTER landing pages are scroll-driven storytelling — pinned chapters, parallax, prose reveals, draw-on-hover button arrows. The blog uses scroll-progress bars and prose stagger. Future customer forks (ADR-0003) will likely want similar motion language.

Three real options were considered for the animation layer. We've been using GSAP + Lenis since v3 and want to record *why*, since the choice is non-obvious and competitors are plausible.

## Decision
The animation stack is:

- **GSAP 3.15+** (`gsap` + `@gsap/react`'s `useGSAP` hook) for all motion — tweens, timelines, ScrollTrigger, CustomEase.
- **Lenis 1.3+** for smooth scrolling, RAF-synced with GSAP via `gsap.ticker.add(t => lenis.raf(t * 1000))` and `lenis.on('scroll', ScrollTrigger.update)`.
- All animation tokens (durations, eases, distances, scrub configs, ScrollTrigger start positions) centralized in `src/shared/animations.ts`. Call sites import the token; they never inline values.
- Paid GSAP plugins (DrawSVG, MorphSVG, SplitText) are avoided — equivalents built with stroke-dasharray manipulation, manual splits, etc. CustomEase is free since GSAP 3.13 and used freely.

## Consequences
+ GSAP's timeline + ScrollTrigger combination is the most mature scroll-driven storytelling toolkit available — Framer Motion and Motion One do not match it for pinned sections, scrub, and complex sequencing.
+ Lenis solves the inertia problem cleanly without scrolljacking. RAF integration keeps GSAP and Lenis in lockstep — no jank.
+ `src/shared/animations.ts` as single source of motion truth means tweaking the feel of the entire site is one file, one PR.
+ GSAP is framework-agnostic — components carry over to Next (ADR-0002) and to customer forks (ADR-0003) byte-identical.
- GSAP's commercial license matters for some uses; we use the free standard license per their current terms. If a customer fork has unusual distribution needs (e.g., a packaged native app sold as a product), check before shipping.
- Lenis owns scroll behavior — it interferes with browser-native scroll anchoring and some libraries that read `window.scrollY` synchronously. Documented in `CLAUDE.md`.
- Reduced-motion users need explicit handling — every ScrollTrigger setup uses `gsap.matchMedia` with a `(prefers-reduced-motion: no-preference)` branch.
? GSAP 4 (when it lands) may reshape the API. We follow major versions deliberately, not eagerly.

## Alternatives Considered
- **Framer Motion.** Strong on React component-level animation (enter/exit, gestures, layout). Weak on scroll-driven timelines and pinning — `useScroll` and `useTransform` are usable but verbose and don't match GSAP's ScrollTrigger ergonomics. Rejected for scroll-storytelling, but acknowledged as the better choice for some component-level cases (we don't currently need them).
- **Motion One.** Newer, lighter, Web Animations API based. Promising for performance. Rejected because the scroll-driven story (ScrollTrigger-equivalent) is not as mature, and the ecosystem is much smaller — fewer recipes, fewer Stack Overflow answers, less battle-tested.
- **CSS-only with `@scroll-timeline` + `animation-timeline`.** The future, but not the present — browser support is still uneven and the syntax doesn't yet handle scrub + pin combinations the way our designs need. Revisit in 1–2 years.
- **Lottie + AfterEffects.** Rejected because our motion is generated, not designer-handed-off — and editing motion in JSON is worse than editing it in `animations.ts`.

## Revisit When
- `@scroll-timeline` CSS hits broad browser support AND can express scrub + pin + sequencing — at that point, a partial CSS migration may shed JS bytes.
- GSAP's licensing terms change adversely for our use cases.
- A customer fork's motion needs are dramatically simpler (fade-ins only) — for that one fork, you can ship without ScrollTrigger / Lenis without forking the whole template. Document it if you do.
