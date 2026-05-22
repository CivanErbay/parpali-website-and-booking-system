import React from "react";

/**
 * 2-path forward arrow used in CTA-style buttons across SOTER v4.
 * Paired with useArrowDrawHover() — the hook finds these paths via the
 * data-arrow-line / data-arrow-tip attributes and animates their strokes.
 *
 * Sizing: 0.875em (em-based) → scales with the button's font-size.
 * Color: currentColor — inherits from the button text.
 */
export const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    data-arrow
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
    style={{ width: "0.875em", height: "0.875em", flexShrink: 0 }}
  >
    <path
      data-arrow-line
      d="M2 12H21"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <path
      data-arrow-tip
      d="M14 5L21 12L14 19"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
