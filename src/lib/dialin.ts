// Asistente dial-in (spec dial-in-assistant, design D5): motor de reglas
// determinista con las reglas clásicas de extracción. Una sola variable de
// ajuste por sugerencia, siempre con explicación y en tono orientativo.

import type { BrewMethod } from './methods.ts'

export type TasteLabel = 'acido' | 'equilibrado' | 'amargo'

export type DialInInput = {
  method: BrewMethod
  /** tiempo real de la extracción, en segundos */
  timeS: number
  taste: TasteLabel
}

export type DialInAction =
  | 'grind_finer'
  | 'grind_coarser'
  | 'dose_up'
  | 'dose_down'
  | 'keep'

export type DialInSuggestion = {
  action: DialInAction
  title: string
  reason: string
  /** cuando el shot está equilibrado y en rango: ofrecer guardar como receta */
  offerSaveRecipe: boolean
}

export function dialIn({ method, timeS, taste }: DialInInput): DialInSuggestion {
  const { min, max } = method.targetTimeS
  const fast = timeS < min
  const slow = timeS > max

  if (taste === 'equilibrado') {
    if (!fast && !slow) {
      return {
        action: 'keep',
        title: 'No toques nada',
        reason: 'Tiempo en rango y sabor equilibrado: has dado con el punto.',
        offerSaveRecipe: true,
      }
    }
    return {
      action: 'keep',
      title: 'Si sabe bien, déjalo',
      reason: `El tiempo (${timeS} s) está fuera del rango orientativo, pero el sabor manda: no cambies nada todavía.`,
      offerSaveRecipe: true,
    }
  }

  if (taste === 'acido') {
    // ácido/agrio = subextracción
    if (slow) {
      // moler más fino alargaría aún más el tiempo: tocar la dosis
      return {
        action: 'dose_down',
        title: 'Baja la dosis 0,5–1 g',
        reason: `Sabor ácido con un tiempo ya largo (${timeS} s): con menos café extraerás más sin alargar la extracción.`,
        offerSaveRecipe: false,
      }
    }
    return {
      action: 'grind_finer',
      title: 'Muele más fino',
      reason: fast
        ? `Extracción rápida (${timeS} s, objetivo ${min}–${max} s) y sabor ácido: subextracción clásica.`
        : 'Sabor ácido/agrio con tiempo en rango: afina un punto la molienda para extraer un poco más.',
      offerSaveRecipe: false,
    }
  }

  // amargo/astringente = sobreextracción
  if (fast) {
    // moler más grueso aceleraría aún más: tocar la dosis
    return {
      action: 'dose_up',
      title: 'Sube la dosis 0,5–1 g',
      reason: `Sabor amargo con un tiempo ya corto (${timeS} s): con más café extraerás menos sin acortar la extracción.`,
      offerSaveRecipe: false,
    }
  }
  return {
    action: 'grind_coarser',
    title: 'Muele más grueso',
    reason: slow
      ? `Extracción lenta (${timeS} s, objetivo ${min}–${max} s) y sabor amargo: sobreextracción clásica.`
      : 'Sabor amargo/astringente con tiempo en rango: abre un punto la molienda para extraer un poco menos.',
    offerSaveRecipe: false,
  }
}
