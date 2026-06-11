import { describe, expect, it } from 'vitest'
import { METHODS, METHOD_LIST } from './methods.ts'

describe('methods (spec brew-methods)', () => {
  it('espresso tiene ratio 1:2 y objetivo 25–30 s', () => {
    expect(METHODS.espresso.ratio).toBe(2)
    expect(METHODS.espresso.targetTimeS).toEqual({ min: 25, max: 30 })
  })

  it('incluye los seis métodos del MVP', () => {
    expect(METHOD_LIST.map((m) => m.id).sort()).toEqual(
      ['aeropress', 'coldbrew', 'espresso', 'moka', 'prensa', 'v60'].sort(),
    )
  })

  it('V60 tiene fases con bloom y agua acumulada creciente hasta 100 %', () => {
    const phases = METHODS.v60.phases!
    expect(phases[0].name).toBe('Bloom')
    expect(phases.at(-1)!.waterPctEnd).toBe(100)
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i].waterPctEnd).toBeGreaterThan(phases[i - 1].waterPctEnd)
    }
  })

  it('todos los métodos tienen defaults completos y coherentes', () => {
    for (const m of METHOD_LIST) {
      expect(m.ratio).toBeGreaterThan(0)
      expect(m.defaultDoseG).toBeGreaterThan(0)
      expect(m.targetTimeS.max).toBeGreaterThan(m.targetTimeS.min)
    }
  })
})
