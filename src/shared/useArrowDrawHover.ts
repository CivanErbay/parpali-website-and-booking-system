import { useEffect, RefObject } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ANIM } from "./animations";

gsap.registerPlugin(CustomEase);

/**
 * Hover/focus animation for forward-arrow CTA buttons.
 *
 * Resting state: arrow is fully drawn (no visual change vs. a static button).
 * On pointer-enter / keyboard focus: line retracts → tip collapses → both draw back in,
 * text shifts right and returns in parallel. Uses a custom cubic-bezier (overshoot snap).
 *
 * Respects: (hover: hover), (pointer: fine), prefers-reduced-motion (skips animation).
 *
 * Markup expected inside the ref'd element:
 *   <span data-arrow-text>{label}</span>
 *   <ArrowIcon />  // provides path[data-arrow-line] + path[data-arrow-tip]
 */

let easeRegistered = false;
const registerEase = () => {
  if (easeRegistered) return;
  CustomEase.create(ANIM.arrowHover.easeName, ANIM.arrowHover.easeBezier);
  easeRegistered = true;
};

const setStrokeFullDrawn = (path: SVGPathElement) => {
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = "0";
  // store length on the element for later lookups
  (path as SVGPathElement & { __len?: number }).__len = len;
};

const getLen = (path: SVGPathElement) =>
  (path as SVGPathElement & { __len?: number }).__len ?? path.getTotalLength();

export const useArrowDrawHover = <T extends HTMLElement>(
  ref: RefObject<T | null>,
) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerEase();

    const line = el.querySelector<SVGPathElement>("[data-arrow-line]");
    const tip = el.querySelector<SVGPathElement>("[data-arrow-tip]");
    const text = el.querySelector<HTMLElement>("[data-arrow-text]");
    const arrow = el.querySelector<HTMLElement>("[data-arrow]");
    if (!line || !tip || !text) return;

    const mm = gsap.matchMedia();

    mm.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        setStrokeFullDrawn(line);
        setStrokeFullDrawn(tip);
        const lineLen = getLen(line);
        const tipLen = getLen(tip);

        let tl: gsap.core.Timeline | null = null;

        const play = () => {
          if (tl && tl.isActive()) return;
          tl?.kill();
          tl = gsap.timeline({ overwrite: "auto" });

          const {
            emptyDuration,
            fillDuration,
            tipEnterDelay,
            fillTipDelay,
            textShiftDuration,
            textShiftReturnDuration,
            textShiftAmount,
            easeName,
          } = ANIM.arrowHover;

          tl.addLabel("empty")
            /* line retracts to the right edge (dashoffset moves negative). */
            .to(
              line,
              {
                strokeDashoffset: -lineLen,
                duration: emptyDuration,
                ease: easeName,
              },
              "empty",
            )
            /* tip collapses to its middle (both ends of the dash move inward).
               Visually: dashoffset goes to -half so only a tiny notch remains, then jumps. */
            .to(
              tip,
              {
                strokeDashoffset: -tipLen,
                duration: emptyDuration,
                ease: easeName,
              },
              `empty+=${tipEnterDelay}`,
            )
            /* reset line to before-start (invisible left of path). */
            .set(line, { strokeDashoffset: lineLen }, `empty+=${emptyDuration}`)
            .set(tip, { strokeDashoffset: tipLen }, `empty+=${emptyDuration}`)
            .addLabel("fill")
            /* line draws in from left to right. */
            .to(
              line,
              {
                strokeDashoffset: 0,
                duration: fillDuration,
                ease: easeName,
              },
              "fill",
            )
            /* tip draws back in. */
            .to(
              tip,
              {
                strokeDashoffset: 0,
                duration: fillDuration,
                ease: easeName,
              },
              `fill+=${fillTipDelay}`,
            )
            /* text nudges right then returns. */
            .to(
              text,
              {
                x: textShiftAmount,
                duration: textShiftDuration,
                ease: easeName,
              },
              "empty",
            )

            .to(
              arrow,
              {
                x: textShiftAmount,
                duration: textShiftDuration,
                ease: easeName,
              },
              "empty",
            )
            .to(
              arrow,
              {
                x: "0em",
                duration: textShiftReturnDuration,
                ease: easeName,
              },
              `empty+=${textShiftDuration}`,
            )
            .to(
              text,
              {
                x: "0em",
                duration: textShiftReturnDuration,
                ease: easeName,
              },
              `empty+=${textShiftDuration}`,
            );
        };

        const onEnter = () => play();
        const onFocusIn = () => {
          if (el.matches(":focus-visible")) play();
        };

        el.addEventListener("pointerenter", onEnter);
        el.addEventListener("focusin", onFocusIn);

        return () => {
          el.removeEventListener("pointerenter", onEnter);
          el.removeEventListener("focusin", onFocusIn);
          tl?.kill();
          gsap.set([line, tip], {
            clearProps: "strokeDashoffset,strokeDasharray",
          });
          gsap.set(text, { clearProps: "x" });
        };
      },
    );

    return () => mm.revert();
  }, [ref]);
};
