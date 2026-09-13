import { useCallback, useEffect, useState } from 'react'
import type { ThemeMode } from '@/types'

const STORAGE_KEY = 'studysphere-theme'

function applyTheme(mode: ThemeMode) {
  const isDark =
    mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    applyTheme(mode)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (mode === 'system') applyTheme('system')
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable — theme just won't persist across sessions.
    }
  }, [])

  return { mode, setMode }
}
