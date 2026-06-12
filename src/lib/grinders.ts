// Traducción aproximada de ajustes entre molinillos (spec grinder-profiles,
// design D5): proporción lineal del rango, redondeo al paso del destino.
// SIEMPRE orientativa — la UI debe etiquetarla como aproximación.

export type GrinderRange = {
  name: string
  minSetting: number | null
  maxSetting: number | null
  /** granularidad del ajuste (clics); por defecto 1 */
  step: number
}

export type TranslateResult =
  | { ok: true; value: number }
  | { ok: false; reason: 'missing-range'; grinderName: string }
  | { ok: false; reason: 'out-of-range' }

function hasRange(g: GrinderRange): g is GrinderRange & { minSetting: number; maxSetting: number } {
  return g.minSetting !== null && g.maxSetting !== null && g.maxSetting > g.minSetting
}

export function translateSetting(
  value: number,
  from: GrinderRange,
  to: GrinderRange,
): TranslateResult {
  if (!hasRange(from)) return { ok: false, reason: 'missing-range', grinderName: from.name }
  if (!hasRange(to)) return { ok: false, reason: 'missing-range', grinderName: to.name }
  if (value < from.minSetting || value > from.maxSetting) return { ok: false, reason: 'out-of-range' }

  const ratio = (value - from.minSetting) / (from.maxSetting - from.minSetting)
  const raw = to.minSetting + ratio * (to.maxSetting - to.minSetting)
  const step = to.step > 0 ? to.step : 1
  const snapped = Math.round(raw / step) * step
  const clamped = Math.min(to.maxSetting, Math.max(to.minSetting, snapped))
  return { ok: true, value: Math.round(clamped * 10) / 10 }
}

/**
 * Representación única de la molienda para mostrar: si hay ajuste de
 * molinillo manda el numérico («C40 · 14», o «14» sin nombre), si no el
 * texto libre. Los dos campos son el MISMO dato en dos modos — nunca se
 * muestran por separado.
 */
export function formatGrind(
  grindSetting: string | null,
  grindValue: number | null,
  grinderName: string | null = null,
): string | null {
  if (grindValue !== null) return grinderName ? `${grinderName} · ${grindValue}` : String(grindValue)
  return grindSetting
}
