import { describe, expect, it } from 'vitest'
import { formatTime, phaseAt } from './timer.ts'
import { METHODS } from './methods.ts'

const phases = METHODS.v60.phases! // Bloom 45s/15%, vertido 45s/60%, vertido 45s/100%

describe('phaseAt (spec brew-timer)', () => {
  it('localiza la fase actual y su agua objetivo acumulada', () => {
    const p = phaseAt(phases, 10, 240)!
    expect(p).toMatchObject({ index: 0, name: 'Bloom', waterTargetG: 36, finished: false })
    expect(p.remainingInPhaseS).toBe(35)
  })

  it('cambia de fase al agotarse la duración', () => {
    expect(phaseAt(phases, 45, 240)!.index).toBe(1)
    expect(phaseAt(phases, 45, 240)!.waterTargetG).toBe(144)
  })

  it('al agotar todas las fases marca finished con el agua total', () => {
    const p = phaseAt(phases, 200, 240)!
    expect(p.finished).toBe(true)
    expect(p.waterTargetG).toBe(240)
  })

  it('sin agua conocida devuelve waterTargetG null', () => {
    expect(phaseAt(phases, 10, null)!.waterTargetG).toBeNull()
  })

  it('sin fases devuelve null (métodos sin vertidos)', () => {
    expect(phaseAt([], 10, 240)).toBeNull()
  })
})

describe('formatTime', () => {
  it('segundos sueltos bajo el minuto, mm:ss a partir de 60', () => {
    expect(formatTime(27.4)).toBe('27s')
    expect(formatTime(150)).toBe('2:30')
    expect(formatTime(60)).toBe('1:00')
  })
})
