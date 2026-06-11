// Inventario predictivo (delta spec coffee-inventory, design D4).
// Todo derivado al vuelo de brews.bag_id + dose_g: nada se almacena.

export type BrewForInventory = {
  doseG: number
  /** fecha de la extracción, ISO (yyyy-mm-dd o timestamp) */
  brewedAt: string
}

/** Gramos restantes del paquete: peso inicial menos dosis consumidas. */
export function remainingG(weightG: number, brews: BrewForInventory[]): number {
  const used = brews.reduce((sum, b) => sum + b.doseG, 0)
  return Math.max(0, Math.round((weightG - used) * 10) / 10)
}

/** Dosis restantes aproximadas según la dosis típica. */
export function remainingDoses(remaining: number, typicalDoseG: number): number {
  if (typicalDoseG <= 0) return 0
  return Math.floor(remaining / typicalDoseG)
}

const WINDOW_DAYS = 14

/**
 * Fecha estimada de fin «al ritmo actual»: consumo medio diario en los
 * últimos 14 días (desde el primer brew dentro de la ventana) extrapolado.
 * Devuelve null sin consumo reciente — mejor callar que predecir mal.
 */
export function predictEndDate(
  weightG: number,
  brews: BrewForInventory[],
  today: string,
): { endDate: string; daysLeft: number } | null {
  const remaining = remainingG(weightG, brews)
  if (remaining <= 0) return null

  const todayMs = Date.parse(today.slice(0, 10))
  const windowStart = todayMs - (WINDOW_DAYS - 1) * 86_400_000
  const recent = brews.filter((b) => Date.parse(b.brewedAt.slice(0, 10)) >= windowStart)
  if (recent.length === 0) return null

  const firstMs = Math.min(...recent.map((b) => Date.parse(b.brewedAt.slice(0, 10))))
  const spanDays = Math.floor((todayMs - firstMs) / 86_400_000) + 1
  const ratePerDay = recent.reduce((sum, b) => sum + b.doseG, 0) / spanDays
  if (ratePerDay <= 0) return null

  const daysLeft = Math.ceil(remaining / ratePerDay)
  const endDate = new Date(todayMs + daysLeft * 86_400_000).toISOString().slice(0, 10)
  return { endDate, daysLeft }
}
