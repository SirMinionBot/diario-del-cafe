import { describe, expect, it } from 'vitest'
import { formatGrind, translateSetting, type GrinderRange } from './grinders.ts'

const c40: GrinderRange = { name: 'Comandante C40', minSetting: 0, maxSetting: 40, step: 1 }
const wide: GrinderRange = { name: 'Molinillo ancho', minSetting: 0, maxSetting: 80, step: 2 }
const sinRango: GrinderRange = { name: 'Sin rango', minSetting: null, maxSetting: null, step: 1 }

describe('translateSetting (spec grinder-profiles)', () => {
  it('escenario de la spec: 14 en 0–40 → ≈28 en 0–80 con paso 2', () => {
    const r = translateSetting(14, c40, wide)
    expect(r).toEqual({ ok: true, value: 28 })
  })

  it('redondea al paso del destino', () => {
    const r = translateSetting(15, c40, wide) // 30 exacto; 15.5 daría 31 → snap a 32/30
    expect(r).toEqual({ ok: true, value: 30 })
    const odd = translateSetting(13, c40, wide) // 26
    expect(odd).toEqual({ ok: true, value: 26 })
  })

  it('rangos con mínimo distinto de cero', () => {
    const from: GrinderRange = { name: 'A', minSetting: 10, maxSetting: 30, step: 1 }
    const to: GrinderRange = { name: 'B', minSetting: 1, maxSetting: 11, step: 0.5 }
    expect(translateSetting(20, from, to)).toEqual({ ok: true, value: 6 })
  })

  it('molinillo sin rango: explica cuál falta', () => {
    const r = translateSetting(14, c40, sinRango)
    expect(r).toEqual({ ok: false, reason: 'missing-range', grinderName: 'Sin rango' })
  })

  it('valor fuera del rango de origen', () => {
    expect(translateSetting(50, c40, wide)).toEqual({ ok: false, reason: 'out-of-range' })
  })

  it('resultado acotado al rango destino', () => {
    const r = translateSetting(40, c40, wide)
    expect(r).toEqual({ ok: true, value: 80 })
  })
})

describe('formatGrind', () => {
  it('con ajuste de molinillo manda el numérico con nombre', () => {
    expect(formatGrind('fina', 14, 'C40')).toBe('C40 · 14')
  })
  it('ajuste sin nombre de molinillo: solo el número', () => {
    expect(formatGrind(null, 14)).toBe('14')
  })
  it('sin ajuste cae al texto libre (o null si no hay nada)', () => {
    expect(formatGrind('media-fina', null)).toBe('media-fina')
    expect(formatGrind(null, null)).toBeNull()
  })
  it('el ajuste 0 es un ajuste válido, no ausencia', () => {
    expect(formatGrind('gruesa', 0, 'Comandante')).toBe('Comandante · 0')
  })
})
