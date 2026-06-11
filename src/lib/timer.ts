// Progreso de fases del cronómetro (spec brew-timer). Lógica pura: la fuente
// de verdad del tiempo son timestamps (design D4); aquí solo se deriva en qué
// fase está una extracción dado el tiempo transcurrido.

import type { BrewPhase } from './methods.ts'

export type PhaseProgress = {
  index: number
  name: string
  elapsedInPhaseS: number
  remainingInPhaseS: number
  /** agua acumulada objetivo al final de la fase, si se conoce el agua total */
  waterTargetG: number | null
  /** true cuando se han agotado todas las fases */
  finished: boolean
}

export function phaseAt(
  phases: BrewPhase[],
  elapsedS: number,
  totalWaterG: number | null,
): PhaseProgress | null {
  if (phases.length === 0) return null
  let start = 0
  for (let i = 0; i < phases.length; i++) {
    const end = start + phases[i].durationS
    if (elapsedS < end) {
      return {
        index: i,
        name: phases[i].name,
        elapsedInPhaseS: elapsedS - start,
        remainingInPhaseS: end - elapsedS,
        waterTargetG: totalWaterG !== null
          ? Math.round(totalWaterG * (phases[i].waterPctEnd / 100))
          : null,
        finished: false,
      }
    }
    start = end
  }
  const last = phases[phases.length - 1]
  return {
    index: phases.length - 1,
    name: last.name,
    elapsedInPhaseS: elapsedS - (start - last.durationS),
    remainingInPhaseS: 0,
    waterTargetG: totalWaterG,
    finished: true,
  }
}

/** mm:ss para filtro, segundos sueltos para extracciones cortas. */
export function formatTime(s: number): string {
  const whole = Math.floor(s)
  if (whole < 60) return `${whole}s`
  const m = Math.floor(whole / 60)
  const sec = whole % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
