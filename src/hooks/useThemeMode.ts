import { useContext } from 'react'
import { ThemeContext } from '../lib/theme-context.ts'

export function useThemeMode() {
  return useContext(ThemeContext)
}
