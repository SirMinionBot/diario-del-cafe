import { describe, expect, it } from 'vitest'
import { dialIn } from './dialin.ts'
import { METHODS } from './methods.ts'

const espresso = METHODS.espresso

describe('dialIn (spec dial-in-assistant)', () => {
  it('shot rápido y ácido → moler más fino (subextracción)', () => {
    const s = dialIn({ method: espresso, timeS: 18, taste: 'acido' })
    expect(s.action).toBe('grind_finer')
    expect(s.reason).toMatch(/subextracción/i)
  })

  it('shot lento y amargo → moler más grueso (sobreextracción)', () => {
    const s = dialIn({ method: espresso, timeS: 38, taste: 'amargo' })
    expect(s.action).toBe('grind_coarser')
    expect(s.reason).toMatch(/sobreextracción/i)
  })

  it('shot equilibrado en rango → no tocar y ofrecer guardar receta', () => {
    const s = dialIn({ method: espresso, timeS: 27, taste: 'equilibrado' })
    expect(s.action).toBe('keep')
    expect(s.offerSaveRecipe).toBe(true)
  })

  it('una sola variable: ácido pero lento sugiere dosis, no molienda', () => {
    const s = dialIn({ method: espresso, timeS: 35, taste: 'acido' })
    expect(s.action).toBe('dose_down')
  })

  it('una sola variable: amargo pero rápido sugiere dosis, no molienda', () => {
    const s = dialIn({ method: espresso, timeS: 20, taste: 'amargo' })
    expect(s.action).toBe('dose_up')
  })

  it('es determinista: misma entrada, misma salida', () => {
    const a = dialIn({ method: espresso, timeS: 18, taste: 'acido' })
    const b = dialIn({ method: espresso, timeS: 18, taste: 'acido' })
    expect(a).toEqual(b)
  })

  it('equilibrado fuera de rango: el sabor manda, no cambiar nada', () => {
    const s = dialIn({ method: espresso, timeS: 35, taste: 'equilibrado' })
    expect(s.action).toBe('keep')
    expect(s.offerSaveRecipe).toBe(true)
  })
})
