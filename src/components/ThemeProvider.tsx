import type { ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme.ts'
import { ThemeContext } from '../lib/theme-context.ts'

/** Única instancia del tema: aplica data-theme en <html> para toda la app. */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme()
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
