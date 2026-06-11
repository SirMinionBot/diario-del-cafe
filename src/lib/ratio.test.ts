import { describe, expect, it } from 'vitest'
import { coffeeForWater, formatRatio, ratioFor, waterForCoffee } from './ratio.ts'

describe('ratio (spec ratio-calculator)', () => {
  it('café conocido, agua calculada: 15 g a 1:16 → 240 g', () => {
    expect(waterForCoffee(15, 16)).toBe(240)
  })

  it('agua conocida, café calculado: 36 g a 1:2 → 18 g', () => {
    expect(coffeeForWater(36, 2)).toBe(18)
  })

  it('redondea a 0,1 g', () => {
    expect(coffeeForWater(250, 16)).toBe(15.6)
    expect(waterForCoffee(17.5, 2.5)).toBe(43.8)
  })

  it('entradas no positivas devuelven 0', () => {
    expect(waterForCoffee(0, 16)).toBe(0)
    expect(waterForCoffee(15, 0)).toBe(0)
    expect(coffeeForWater(-10, 16)).toBe(0)
  })

  it('ratioFor deriva el ratio de una pareja real', () => {
    expect(ratioFor(18, 36)).toBe(2)
    expect(ratioFor(15, 250)).toBe(16.7)
    expect(ratioFor(0, 250)).toBeNull()
  })

  it('formatRatio pinta 1:N', () => {
    expect(formatRatio(16)).toBe('1:16')
    expect(formatRatio(16.5)).toBe('1:16,5')
  })
})
