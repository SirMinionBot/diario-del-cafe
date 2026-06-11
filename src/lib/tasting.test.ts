import { describe, expect, it } from 'vitest'
import { aggregateTastings, parseTasting, type Tasting } from './tasting.ts'

const valid: Tasting = {
  acidez: 4,
  cuerpo: 3,
  dulzor: 4,
  amargor: 2,
  descriptores: ['cítrico', 'caramelo'],
}

describe('parseTasting (spec tasting-notes)', () => {
  it('acepta una cata válida', () => {
    expect(parseTasting(valid)).toEqual(valid)
  })

  it('rechaza ejes fuera de rango 1–5', () => {
    expect(parseTasting({ ...valid, acidez: 6 })).toBeNull()
    expect(parseTasting({ ...valid, cuerpo: 0 })).toBeNull()
    expect(parseTasting({ ...valid, dulzor: 3.5 })).toBeNull()
  })

  it('rechaza descriptores fuera del vocabulario de la rueda', () => {
    expect(parseTasting({ ...valid, descriptores: ['gasolina'] })).toBeNull()
  })

  it('rechaza estructuras ajenas (jsonb corrupto)', () => {
    expect(parseTasting(null)).toBeNull()
    expect(parseTasting('cata')).toBeNull()
    expect(parseTasting({})).toBeNull()
  })
})

describe('aggregateTastings (perfil sensorial)', () => {
  it('media por eje y descriptores más frecuentes', () => {
    const profile = aggregateTastings([
      valid,
      { ...valid, acidez: 2, descriptores: ['cítrico', 'miel'] },
      { ...valid, acidez: 3, descriptores: ['cítrico'] },
    ])!
    expect(profile.ejes.acidez).toBe(3)
    expect(profile.topDescriptores[0]).toBe('cítrico')
    expect(profile.catas).toBe(3)
  })

  it('sin catas devuelve null', () => {
    expect(aggregateTastings([])).toBeNull()
  })
})
