'use client'

import { useEffect, useState } from 'react'
import styles from '../ConfigForms/forms.module.css'

/** Chromium-only event; Safari/iPadOS never fires it. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Mode = 'unknown' | 'installed' | 'prompt' | 'ios' | 'manual'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isAppleTouch(): boolean {
  const ua = navigator.userAgent
  // iPadOS Safari meldet sich als „Macintosh“ — echte Macs haben keinen Touchscreen.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/**
 * Settings-Karte „Als App installieren“. Chromium bekommt einen echten Button
 * (beforeinstallprompt); iPad/iPhone können nur manuell über „Teilen →
 * Zum Home-Bildschirm“ installieren, daher dort die Schritt-Anleitung.
 */
export function InstallApp() {
  const [mode, setMode] = useState<Mode>('unknown')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone()) {
      setMode('installed')
      return
    }
    setMode(isAppleTouch() ? 'ios' : 'manual')

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('prompt')
    }
    const onInstalled = () => setMode('installed')
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    if (outcome === 'accepted') setMode('installed')
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Als App installieren</h2>
      <div className={styles.card}>
        {mode === 'installed' ? (
          <p className={styles.statusOk}>Das Dashboard läuft bereits als App auf diesem Gerät.</p>
        ) : null}

        {mode === 'prompt' ? (
          <div className={styles.section}>
            <p className={styles.hint}>
              Installiert das Dashboard als eigene App — ohne Browser-Leiste, direkt vom Startbildschirm.
            </p>
            <div>
              <button type="button" className={styles.saveBtn} onClick={install}>
                App installieren
              </button>
            </div>
          </div>
        ) : null}

        {mode === 'ios' ? (
          <div className={styles.section}>
            <p className={styles.hint}>
              Auf iPad und iPhone geht das über Safari — in drei Schritten:
            </p>
            <ol className={styles.list}>
              <li>
                Oben rechts auf <strong>Teilen</strong> tippen (Quadrat mit Pfeil nach oben).
              </li>
              <li>
                <strong>Zum Home-Bildschirm</strong> wählen (ggf. in der Liste nach unten scrollen).
              </li>
              <li>
                Auf <strong>Hinzufügen</strong> tippen — das Parpali-Symbol erscheint auf dem Home-Bildschirm.
              </li>
            </ol>
            <p className={styles.hint}>
              In der App einmal anmelden — die Anmeldung bleibt danach bestehen.
            </p>
          </div>
        ) : null}

        {mode === 'manual' ? (
          <p className={styles.hint}>
            Öffne diese Seite in Safari (iPad) oder Chrome/Edge, um das Dashboard als App zu installieren.
          </p>
        ) : null}
      </div>
    </section>
  )
}
