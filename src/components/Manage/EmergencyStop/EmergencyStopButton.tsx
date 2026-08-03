'use client'

import { useState } from 'react'
import styles from './EmergencyStopButton.module.css'

/**
 * "Notknopf" — instantly halts the entire online reservation service
 * (booking-settings.emergencyStop). Controlled by the parent (ManageChrome)
 * so the sidebar button and the page-wide banner stay in sync. Always
 * visible in the sidebar so staff can find it from any dashboard page.
 */
export function EmergencyStopButton({
  active,
  onChange,
}: {
  active: boolean
  onChange: (active: boolean) => void
}) {
  const [pending, setPending] = useState(false)

  async function toggle(next: boolean) {
    if (
      next &&
      !window.confirm(
        'Reservierungsservice wirklich sofort stoppen? Gäste können danach keine neuen Online-Reservierungen mehr vornehmen, bis du ihn wieder freigibst.',
      )
    ) {
      return
    }
    setPending(true)
    try {
      const res = await fetch('/api/manage/emergency-stop', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: next }),
      })
      if (res.ok) onChange(next)
    } finally {
      setPending(false)
    }
  }

  if (active) {
    return (
      <button
        type="button"
        className={styles.buttonActive}
        onClick={() => toggle(false)}
        disabled={pending}
      >
        🛑 Notknopf aktiv — wieder freigeben
      </button>
    )
  }

  return (
    <button type="button" className={styles.button} onClick={() => toggle(true)} disabled={pending}>
      🛑 Notknopf
    </button>
  )
}
