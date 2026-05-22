'use client'

import { useState } from 'react'
import styles from './EmbedSnippet.module.css'

/** Copyable iframe embed snippet for the booking widget. */
export function EmbedSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — the code stays selectable */
    }
  }

  return (
    <div className={styles.root}>
      <pre className={styles.code}>{snippet}</pre>
      <button type="button" className={styles.copy} onClick={copy}>
        {copied ? 'Kopiert ✓' : 'Code kopieren'}
      </button>
    </div>
  )
}
