import { describe, expect, it } from 'vitest'
import { daysSinceRoast, freshnessState } from './freshness.ts'

describe('freshness (spec coffee-inventory)', () => {
  it('calcula días completos desde el tueste', () => {
    expect(daysSinceRoast('2026-06-01', '2026-06-15')).toBe(14)
    expect(daysSinceRoast('2026-06-01', '2026-06-01')).toBe(0)
  })

  it('14 días está en ventana óptima para cualquier familia', () => {
    expect(freshnessState(14, 'espresso')).toBe('optimo')
    expect(freshnessState(14, 'filtro')).toBe('optimo')
    expect(freshnessState(14, 'inmersion')).toBe('optimo')
  })

  it('espresso necesita más reposo que filtro', () => {
    expect(freshnessState(6, 'espresso')).toBe('reposo')
    expect(freshnessState(6, 'filtro')).toBe('optimo')
  })

  it('pasada la ventana avisa sin bloquear (estado pasado)', () => {
    expect(freshnessState(41, 'espresso')).toBe('pasado')
    expect(freshnessState(31, 'filtro')).toBe('pasado')
  })

  it('límites inclusivos de la ventana', () => {
    expect(freshnessState(10, 'espresso')).toBe('optimo')
    expect(freshnessState(40, 'espresso')).toBe('optimo')
  })
})
