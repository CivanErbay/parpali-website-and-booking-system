/**
 * Central animation tokens — tweak here, all GSAP/Lenis call sites pick it up.
 *
 * v3 (Editorial Tuscan) extends the baseline with parallax, letter stagger,
 * marquee, clip-path image reveal, magnetic hover, and floating-CTA tokens.
 *
 * Convention: numbers in seconds (durations) / rem-or-px-percent (y/yPercent).
 * Eases use GSAP names ("power2.out", "power3.out", "none", …).
 * ScrollTrigger `start` strings follow "<trigger-pos> <viewport-pos>".
 */
export const ANIM = {
  /* Lenis smooth-scroll feel.
     Used in: src/preview/SmoothScroll.tsx */
  smoothScroll: {
    duration: 1.1,
  },

  /* ── Chapter wrapper ─────────────────────────────────
     Used in: src/components/Chapter/Chapter.tsx */
  chapterRail: {
    duration: 0.6,
    y: 24,
    ease: "power2.out",
    start: "top 85%",
  },
  chapterReveal: {
    duration: 0.7,
    y: 32,
    stagger: 0.08,
    ease: "power2.out",
    start: "top 75%",
  },

  /* ── Scroll reveal (general fade-up wrapper) ────────
     Used in: src/components/ScrollReveal/ScrollReveal.tsx */
  reveal: {
    duration: 0.6,
    y: 16,
    stagger: 0.06,
    ease: "power2.out",
    start: "top 88%",
  },

  /* ── Parallax background scroll ──────────────────────
     Used in: src/components/ParallaxImage/ParallaxImage.tsx
     `speed` = 0..1 fraction of scroll distance the image translates.
     0.35 = image moves 35% as fast as the surrounding scroll. */
  parallax: {
    speed: 0.35,
  },

  /* ── Letter-by-letter title reveal ──────────────────
     Used in: src/components/EditorialHero/EditorialHero.tsx */
  letterStagger: {
    duration: 0.7,
    y: 28,
    stagger: 0.025,
    ease: "power3.out",
  },

  /* ── Marquee (infinite horizontal text loop) ────────
     Used in: src/components/Marquee/Marquee.tsx
     Pure CSS animation; `duration` in seconds per full loop. */
  marquee: {
    duration: 32,
    ease: "none",
  },

  /* ── Clip-path image reveal on scroll ───────────────
     Used in: src/components/ClipReveal/ClipReveal.tsx */
  clipReveal: {
    duration: 1.0,
    ease: "power3.out",
    start: "top 82%",
  },

  /* ── Magnetic button hover ──────────────────────────
     Used in: src/components/MagneticButton/MagneticButton.tsx
     `strength` = 0..1 fraction of cursor offset applied as translate. */
  magnetic: {
    duration: 0.45,
    ease: "power2.out",
    strength: 0.3,
  },

  /* ── Floating reserve CTA (slides in after hero) ────
     Used in: src/components/FloatingReserveCta/FloatingReserveCta.tsx
     Appears after the user scrolls past `appearAfter` fraction of viewport. */
  floatingCta: {
    duration: 0.5,
    y: 80,
    ease: "power3.out",
    appearAfter: 0.6,
  },

  /* ── Button — arrow draw hover ──────────────────────
     CustomEase from bezier values, registered once by the hook.

     Used in (hook): src/shared/useArrowDrawHover.ts */
  arrowHover: {
    emptyDuration: 0.1666,
    fillDuration: 0.1666,
    tipEnterDelay: 0.125,
    fillTipDelay: 0.15,
    textShiftDuration: 0.0666,
    textShiftReturnDuration: 0.25,
    textShiftAmount: "0.375em",
    easeBezier: "0.2, 1.3, 0.6, 1",
    easeName: "arrowHover",
  },
} as const;
