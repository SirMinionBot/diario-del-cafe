import { describe, expect, it } from 'vitest'
import { monthlySpend, rankByValue, rankCoffees } from './stats.ts'

const coffees = [
  { id: 'a', name: 'Etiopía Natural', pricePerKg: 18 },
  { id: 'b', name: 'Brasil Cerrado', pricePerKg: 12 },
  { id: 'c', name: 'Misterioso', pricePerKg: null },
]

describe('monthlySpend (spec consumption-stats)', () => {
  it('dos paquetes de 250 g a 18 €/kg → 9 € en el mes', () => {
    const spend = monthlySpend(
      coffees,
      [
        { coffeeId: 'a', weightG: 250, createdAt: '2026-06-02' },
        { coffeeId: 'a', weightG: 250, createdAt: '2026-06-20' },
        { coffeeId: 'a', weightG: 250, createdAt: '2026-05-30' }, // otro mes
      ],
      '2026-06',
    )
    expect(spend.totalEur).toBe(9)
    expect(spend.byCoffee).toEqual([{ coffeeId: 'a', name: 'Etiopía Natural', eur: 9 }])
  })

  it('paquetes sin precio quedan excluidos y contados', () => {
    const spend = monthlySpend(
      coffees,
      [
        { coffeeId: 'c', weightG: 250, createdAt: '2026-06-05' },
        { coffeeId: 'b', weightG: 500, createdAt: '2026-06-05' },
      ],
      '2026-06',
    )
    expect(spend.totalEur).toBe(6)
    expect(spend.excludedBags).toBe(1)
  })
})

describe('rankCoffees (spec brand-ranking)', () => {
  const brews = [
    { coffeeId: 'a', rating: 5 },
    { coffeeId: 'a', rating: 4 },
    { coffeeId: 'b', rating: 4 },
    { coffeeId: 'b', rating: null }, // sin valorar: cuenta como brew, no como nota
  ]

  it('ordena por nota media y cuenta extracciones', () => {
    const ranked = rankCoffees(coffees, brews)
    expect(ranked[0]).toMatchObject({ coffeeId: 'a', avgRating: 4.5, brewCount: 2 })
    expect(ranked[1]).toMatchObject({ coffeeId: 'b', avgRating: 4, brewCount: 2 })
  })

  it('los cafés sin valorar van al final', () => {
    const ranked = rankCoffees(coffees, brews)
    expect(ranked.at(-1)).toMatchObject({ coffeeId: 'c', avgRating: null })
  })

  it('precio/calidad excluye cafés sin precio o sin nota', () => {
    const byValue = rankByValue(rankCoffees(coffees, brews))
    expect(byValue.map((c) => c.coffeeId)).toEqual(['b', 'a']) // 4/12 > 4.5/18
  })
})
