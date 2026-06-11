import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'theme'
const PAPER_LIGHT = '#f8f3ea'
const PAPER_DARK = '#1d1713'

function storedMode(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : 'auto'
}

function apply(mode: ThemeMode, systemDark: boolean) {
  const dark = mode === 'dark' || (mode === 'auto' && systemDark)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  // la barra del navegador/PWA acompaña a la paleta (spec dark-mode)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? PAPER_DARK : PAPER_LIGHT)
}

/**
 * Tema claro/oscuro/auto (spec dark-mode): persiste en localStorage, sigue
 * prefers-color-scheme en vivo cuando está en auto y sincroniza theme-color.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(storedMode)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mode, mq.matches)
    const onChange = (e: MediaQueryListEvent) => {
      if (mode === 'auto') apply('auto', e.matches)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const set = useCallback((m: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, m)
    setMode(m)
  }, [])

  return { mode, set }
}
