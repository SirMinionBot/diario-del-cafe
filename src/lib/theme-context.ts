import { createContext } from 'react'
import type { ThemeMode } from '../hooks/useTheme.ts'

export type ThemeState = {
  mode: ThemeMode
  set: (m: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeState>({ mode: 'auto', set: () => {} })
