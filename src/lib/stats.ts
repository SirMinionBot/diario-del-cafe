// Agregados derivados (specs consumption-stats y brand-ranking).
// Patrón "derivar, no almacenar": gasto, ranking y precio/calidad se calculan
// al vuelo desde paquetes y brews; nunca se persisten agregados.

export type CoffeeForStats = {
  id: string
  name: string
  pricePerKg: number | null
}

export type BagForSpend = {
  coffeeId: string
  weightG: number
  /** fecha de registro del paquete, ISO */
  createdAt: string
}

export type BrewForRanking = {
  coffeeId: string
  rating: number | null
}

// ─── gasto mensual ────────────────────────────────────────────────────────────

export type MonthlySpend = {
  totalEur: number
  byCoffee: { coffeeId: string; name: string; eur: number }[]
  /** paquetes sin precio por kg, excluidos del cálculo */
  excludedBags: number
}

/** Gasto del mes (yyyy-mm) derivado de los paquetes registrados ese mes. */
export function monthlySpend(
  coffees: CoffeeForStats[],
  bags: BagForSpend[],
  month: string,
): MonthlySpend {
  const byId = new Map(coffees.map((c) => [c.id, c]))
  const inMonth = bags.filter((b) => b.createdAt.slice(0, 7) === month)
  let excludedBags = 0
  const eurByCoffee = new Map<string, number>()
  for (const bag of inMonth) {
    const coffee = byId.get(bag.coffeeId)
    if (!coffee?.pricePerKg) {
      excludedBags++
      continue
    }
    const eur = (coffee.pricePerKg * bag.weightG) / 1000
    eurByCoffee.set(bag.coffeeId, (eurByCoffee.get(bag.coffeeId) ?? 0) + eur)
  }
  const byCoffee = [...eurByCoffee.entries()]
    .map(([coffeeId, eur]) => ({
      coffeeId,
      name: byId.get(coffeeId)?.name ?? '?',
      eur: Math.round(eur * 100) / 100,
    }))
    .sort((a, b) => b.eur - a.eur)
  return {
    totalEur: Math.round(byCoffee.reduce((s, c) => s + c.eur, 0) * 100) / 100,
    byCoffee,
    excludedBags,
  }
}

// ─── coste por taza (delta consumption-stats, iteración 3) ───────────────────

export type BrewForCost = {
  coffeeId: string
  doseG: number
}

/** Coste de una extracción en euros, a céntimos; null sin precio o dosis inválida. */
export function brewCostEur(pricePerKg: number | null, doseG: number): number | null {
  if (!pricePerKg || pricePerKg <= 0 || doseG <= 0) return null
  return Math.round((pricePerKg * doseG) / 10) / 100
}

export type CoffeeCost = {
  coffeeId: string
  name: string
  cups: number
  avgEur: number
  totalEur: number
}

export type CostByCoffee = {
  rows: CoffeeCost[]
  /** cafés con extracciones pero sin precio, fuera de la comparativa */
  excludedCoffees: number
}

/** Comparativa de coste por café, ordenada por coste medio descendente. */
export function costByCoffee(coffees: CoffeeForStats[], brews: BrewForCost[]): CostByCoffee {
  const byId = new Map(coffees.map((c) => [c.id, c]))
  const grouped = new Map<string, number[]>()
  for (const b of brews) {
    grouped.set(b.coffeeId, [...(grouped.get(b.coffeeId) ?? []), b.doseG])
  }
  const rows: CoffeeCost[] = []
  let excludedCoffees = 0
  for (const [coffeeId, doses] of grouped) {
    const coffee = byId.get(coffeeId)
    if (!coffee) continue
    if (!coffee.pricePerKg) {
      excludedCoffees++
      continue
    }
    const totalRaw = doses.reduce((s, d) => s + (coffee.pricePerKg! * d) / 1000, 0)
    rows.push({
      coffeeId,
      name: coffee.name,
      cups: doses.length,
      avgEur: Math.round((totalRaw / doses.length) * 100) / 100,
      totalEur: Math.round(totalRaw * 100) / 100,
    })
  }
  rows.sort((a, b) => b.avgEur - a.avgEur)
  return { rows, excludedCoffees }
}

// ─── ranking de cafés ─────────────────────────────────────────────────────────

export type RankedCoffee = {
  coffeeId: string
  name: string
  avgRating: number | null
  brewCount: number
  /** nota por euro/kg; null si falta precio o nota */
  valueScore: number | null
}

/** Ranking por nota media; los cafés sin valorar van al final (spec brand-ranking). */
export function rankCoffees(coffees: CoffeeForStats[], brews: BrewForRanking[]): RankedCoffee[] {
  const ranked = coffees.map((coffee) => {
    const rated = brews.filter((b) => b.coffeeId === coffee.id && b.rating !== null)
    const brewCount = brews.filter((b) => b.coffeeId === coffee.id).length
    const avgRating = rated.length
      ? Math.round((rated.reduce((s, b) => s + (b.rating as number), 0) / rated.length) * 10) / 10
      : null
    const valueScore =
      avgRating !== null && coffee.pricePerKg
        ? Math.round((avgRating / coffee.pricePerKg) * 1000) / 1000
        : null
    return { coffeeId: coffee.id, name: coffee.name, avgRating, brewCount, valueScore }
  })
  return ranked.sort((a, b) => {
    if (a.avgRating === null && b.avgRating === null) return a.name.localeCompare(b.name)
    if (a.avgRating === null) return 1
    if (b.avgRating === null) return -1
    return b.avgRating - a.avgRating
  })
}

/** Orden alternativo por relación precio/calidad; excluye cafés sin precio o sin nota. */
export function rankByValue(ranked: RankedCoffee[]): RankedCoffee[] {
  return ranked
    .filter((c) => c.valueScore !== null)
    .sort((a, b) => (b.valueScore as number) - (a.valueScore as number))
}
