import { describe, expect, it } from 'vitest'
import { REFERENCE_RECIPES, referenceById } from './referenceRecipes.ts'
import { METHODS } from './methods.ts'

describe('referenceRecipes (spec reference-recipes)', () => {
  it('hay al menos 6 recetas y los ids son únicos', () => {
    expect(REFERENCE_RECIPES.length).toBeGreaterThanOrEqual(6)
    const ids = REFERENCE_RECIPES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todas referencian métodos existentes y tienen parámetros coherentes', () => {
    for (const r of REFERENCE_RECIPES) {
      expect(METHODS[r.methodId]).toBeDefined()
      expect(r.ratio).toBeGreaterThan(0)
      expect(r.doseG).toBeGreaterThan(0)
      expect(r.waterTempC).toBeGreaterThan(0)
      expect(r.author.length).toBeGreaterThan(0)
      expect(r.source.length).toBeGreaterThan(0)
    }
  })

  it('las fases, si existen, acumulan hasta el 100 %', () => {
    for (const r of REFERENCE_RECIPES.filter((r) => r.phases)) {
      expect(r.phases!.at(-1)!.waterPctEnd).toBe(100)
    }
  })

  it('referenceById encuentra y devuelve null si no existe', () => {
    expect(referenceById('hoffmann-v60')?.author).toBe('James Hoffmann')
    expect(referenceById('no-existe')).toBeNull()
  })
})
