// Estimación de cafeína (spec consumption-stats). SIEMPRE una estimación:
// mg de cafeína por gramo de café molido según método, basado en valores
// típicos de extracción (un espresso de 18 g ≈ 180 mg; una taza de filtro
// de 15 g ≈ 150 mg). La UI debe etiquetarlo como estimación.

import type { MethodId } from './methods.ts'

export const CAFFEINE_MG_PER_G: Record<MethodId, number> = {
  espresso: 10,
  v60: 10,
  prensa: 9, // inmersión con malla: algo menos eficiente
  aeropress: 9.5,
  moka: 11, // alta presión y temperatura
  coldbrew: 12, // larguísimo contacto; suele beberse diluido, pero estimamos el concentrado
}

export function caffeineForBrew(method: MethodId, doseG: number): number {
  if (doseG <= 0) return 0
  return Math.round(CAFFEINE_MG_PER_G[method] * doseG)
}

export type BrewForCaffeine = {
  method: MethodId
  doseG: number
  /** fecha de la extracción en ISO (yyyy-mm-dd o timestamp) */
  brewedAt: string
}

/** mg estimados por día para los últimos `days` días (incluido `today`), en orden cronológico. */
export function caffeineByDay(
  brews: BrewForCaffeine[],
  today: string,
  days: number,
): { date: string; mg: number }[] {
  const todayMs = Date.parse(today.slice(0, 10))
  const out: { date: string; mg: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(todayMs - i * 86_400_000).toISOString().slice(0, 10)
    const mg = brews
      .filter((b) => b.brewedAt.slice(0, 10) === date)
      .reduce((sum, b) => sum + caffeineForBrew(b.method, b.doseG), 0)
    out.push({ date, mg })
  }
  return out
}
