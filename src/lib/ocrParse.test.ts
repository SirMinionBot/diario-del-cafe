import { describe, expect, it } from 'vitest'
import { parseLabel, similarity } from './ocrParse.ts'

describe('parseLabel (spec label-scanner)', () => {
  it('extrae fecha de tueste numérica con contexto «tostado»', () => {
    const r = parseLabel('CAFÉ ESTUPENDO\nColombia Huila\nTostado el 02/06/2026', [])
    expect(r.roastDate).toBe('2026-06-02')
    expect(r.origin).toBe('Colombia')
  })

  it('extrae fecha textual en español', () => {
    const r = parseLabel('Lote 12\ntostado el 2 de junio de 2026', [])
    expect(r.roastDate).toBe('2026-06-02')
  })

  it('con varias fechas elige la más cercana a «tost…»', () => {
    const r = parseLabel('Caducidad: 01/01/2027\nFecha de tueste: 05/06/2026', [])
    expect(r.roastDate).toBe('2026-06-05')
  })

  it('propone el tostador conocido con matching difuso (evita duplicados)', () => {
    const r = parseLabel('NOMAD C0FFEE\nEtiopía Natural', ['Nomad Coffee', 'Hola Coffee'])
    expect(r.roaster).toBe('Nomad Coffee')
  })

  it('sin nada reconocible devuelve todo null', () => {
    const r = parseLabel('zz\nq', [])
    expect(r).toEqual({ name: null, roaster: null, origin: null, roastDate: null })
  })

  it('el nombre candidato es una línea destacada que no es fecha ni tostador', () => {
    const r = parseLabel('Nomad Coffee\nFinca El Paraíso doble fermentación\n12/05/2026', ['Nomad Coffee'])
    expect(r.name).toBe('Finca El Paraíso doble fermentación')
  })

  it('fechas inválidas se descartan', () => {
    expect(parseLabel('tostado 45/13/2026', []).roastDate).toBeNull()
  })

  it('origen con tilde en la etiqueta: «Etiopía» se detecta (regresión)', () => {
    expect(parseLabel('Café de ETIOPÍA región Guji', []).origin).toBe('Etiopía')
    expect(parseLabel('origen: Perú', []).origin).toBe('Perú')
  })

  it('tostador NUEVO sin catálogo: línea con pinta de marca (regresión)', () => {
    const r = parseLabel('HOLA COFFEE ROASTERS\nFinca La Esperanza\nColombia', [])
    expect(r.roaster).toBe('HOLA COFFEE ROASTERS')
    expect(r.name).toBe('Finca La Esperanza')
  })

  it('también reconoce «tostadores» en español como pista de marca', () => {
    const r = parseLabel('Bonita finca\nTostadores del Sur', [])
    expect(r.roaster).toBe('Tostadores del Sur')
  })

  it('las líneas de ruido OCR (símbolos) no contaminan el nombre', () => {
    const r = parseLabel('~~==--##++**\nKenia Nyeri AA\n....;;;;....', [])
    expect(r.name).toBe('Kenia Nyeri AA')
  })
})

describe('similarity', () => {
  it('1 para iguales, alto para variantes OCR, bajo para distintos', () => {
    expect(similarity('Nomad Coffee', 'Nomad Coffee')).toBe(1)
    expect(similarity('NOMAD C0FFEE', 'Nomad Coffee')).toBeGreaterThan(0.6)
    expect(similarity('Nomad Coffee', 'Hola Coffee')).toBeLessThan(0.7)
  })
})
