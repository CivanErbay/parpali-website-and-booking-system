'use client'

import { useEffect, useState } from 'react'

export type Mode = 'light' | 'dark'

const STORAGE_KEY = 'parpaliMode'
const DEFAULT: Mode = 'light'

function isMode(v: unknown): v is Mode {
  return v === 'light' || v === 'dark'
}

export function useMode() {
  const [mode, setModeState] = useState<Mode>(DEFAULT)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isMode(stored)) {
        setModeState(stored)
        document.documentElement.dataset.mode = stored
      }
    } catch {
      // localStorage unavailable — fall back to default
    }
  }, [])

  const setMode = (next: Mode) => {
    setModeState(next)
    document.documentElement.dataset.mode = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  return { mode, setMode, toggle: () => setMode(mode === 'light' ? 'dark' : 'light') }
}
