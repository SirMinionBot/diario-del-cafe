// Calculadora inversa café⇄agua (spec ratio-calculator).
// Funciones puras: reciben el ratio activo (del método o la receta) y un lado,
// devuelven el otro. Redondeo a 0,1 g — la resolución de una báscula doméstica.

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Gramos de agua (o bebida objetivo) para una dosis de café dada. */
export function waterForCoffee(coffeeG: number, ratio: number): number {
  if (coffeeG <= 0 || ratio <= 0) return 0
  return round1(coffeeG * ratio)
}

/** Gramos de café para una cantidad de agua (o bebida objetivo) dada. */
export function coffeeForWater(waterG: number, ratio: number): number {
  if (waterG <= 0 || ratio <= 0) return 0
  return round1(waterG / ratio)
}

/** Ratio resultante de una pareja café/agua (para mostrar "1:N" en registros). */
export function ratioFor(coffeeG: number, waterG: number): number | null {
  if (coffeeG <= 0 || waterG <= 0) return null
  return round1(waterG / coffeeG)
}

/** Formatea un ratio numérico como "1:16" (o "1:16,5"). */
export function formatRatio(ratio: number): string {
  const n = round1(ratio)
  return `1:${Number.isInteger(n) ? n : n.toLocaleString('es-ES')}`
}
