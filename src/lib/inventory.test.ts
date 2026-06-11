import { describe, expect, it } from 'vitest'
import { predictEndDate, remainingDoses, remainingG } from './inventory.ts'

describe('inventory (delta spec coffee-inventory)', () => {
  it('descuenta las dosis del peso inicial: 250 g − 72 g = 178 g', () => {
    const brews = [
      { doseG: 18, brewedAt: '2026-06-10' },
      { doseG: 18, brewedAt: '2026-06-10' },
      { doseG: 18, brewedAt: '2026-06-11' },
      { doseG: 18, brewedAt: '2026-06-11' },
    ]
    expect(remainingG(250, brews)).toBe(178)
  })

  it('nunca devuelve negativo', () => {
    expect(remainingG(50, [{ doseG: 60, brewedAt: '2026-06-11' }])).toBe(0)
  })

  it('dosis restantes según dosis típica', () => {
    expect(remainingDoses(178, 18)).toBe(9)
    expect(remainingDoses(10, 18)).toBe(0)
  })

  it('predicción con ritmo estable: ~36 g/día y 108 g restantes → 3 días', () => {
    // paquete de 216 g: 3 días consumiendo 36 g/día → quedan 108 g
    const brews = [
      { doseG: 18, brewedAt: '2026-06-09' },
      { doseG: 18, brewedAt: '2026-06-09' },
      { doseG: 18, brewedAt: '2026-06-10' },
      { doseG: 18, brewedAt: '2026-06-10' },
      { doseG: 18, brewedAt: '2026-06-11' },
      { doseG: 18, brewedAt: '2026-06-11' },
    ]
    const p = predictEndDate(216, brews, '2026-06-11')!
    expect(p.daysLeft).toBe(3)
    expect(p.endDate).toBe('2026-06-14')
  })

  it('sin consumo en los últimos 14 días no predice', () => {
    const brews = [{ doseG: 18, brewedAt: '2026-05-01' }]
    expect(predictEndDate(250, brews, '2026-06-11')).toBeNull()
  })

  it('paquete agotado no predice', () => {
    const brews = [{ doseG: 250, brewedAt: '2026-06-11' }]
    expect(predictEndDate(250, brews, '2026-06-11')).toBeNull()
  })
})
