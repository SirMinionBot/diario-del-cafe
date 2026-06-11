// Frescura del paquete: días desde el tueste y ventana óptima por familia
// de método (spec coffee-inventory; resuelve la open question del design:
// espresso prefiere más reposo que el filtro).

import type { MethodFamily } from './methods.ts'

export type FreshnessState = 'reposo' | 'optimo' | 'pasado'

export type FreshnessWindow = {
  /** días de desgasificación antes de entrar en ventana */
  restUntilD: number
  /** último día (incluido) dentro de la ventana óptima */
  goodUntilD: number
}

export const FRESHNESS_WINDOWS: Record<MethodFamily, FreshnessWindow> = {
  espresso: { restUntilD: 10, goodUntilD: 40 },
  filtro: { restUntilD: 4, goodUntilD: 30 },
  inmersion: { restUntilD: 4, goodUntilD: 35 },
}

/** Días completos transcurridos desde el tueste (fechas en formato ISO yyyy-mm-dd). */
export function daysSinceRoast(roastDate: string, today: string): number {
  const ms = Date.parse(today) - Date.parse(roastDate)
  return Math.floor(ms / 86_400_000)
}

export function freshnessState(days: number, family: MethodFamily): FreshnessState {
  const w = FRESHNESS_WINDOWS[family]
  if (days < w.restUntilD) return 'reposo'
  if (days <= w.goodUntilD) return 'optimo'
  return 'pasado'
}

export const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  reposo: 'En reposo',
  optimo: 'En ventana óptima',
  pasado: 'Frescura pasada',
}
