'use client'

import styles from './ModeSwitcher.module.css'
import { useMode } from './useMode'

export function ModeSwitcher() {
  const { mode, toggle } = useMode()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Auf Tagesmodus wechseln' : 'Auf Abendmodus wechseln'}
      title={isDark ? 'Tagesmodus' : 'Abendmodus'}
      className={styles.btn}
      onClick={toggle}
    >
      <span className={styles.iconWrap}>
        {/* Sun icon (visible in light mode) */}
        <svg
          className={`${styles.icon} ${styles.sun}`}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
          </g>
        </svg>
        {/* Moon icon (visible in dark mode) */}
        <svg
          className={`${styles.icon} ${styles.moon}`}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
            fill="currentColor"
          />
        </svg>
      </span>
    </button>
  )
}
