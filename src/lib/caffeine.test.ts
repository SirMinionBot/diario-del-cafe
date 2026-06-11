import { describe, expect, it } from 'vitest'
import { caffeineByDay, caffeineForBrew } from './caffeine.ts'

describe('caffeine (spec consumption-stats)', () => {
  it('estima por método y dosis', () => {
    expect(caffeineForBrew('espresso', 18)).toBe(180)
    expect(caffeineForBrew('v60', 15)).toBe(150)
    expect(caffeineForBrew('espresso', 0)).toBe(0)
  })

  it('acumula el total del día: dos espressos de 18 g', () => {
    const days = caffeineByDay(
      [
        { method: 'espresso', doseG: 18, brewedAt: '2026-06-11T08:00:00Z' },
        { method: 'espresso', doseG: 18, brewedAt: '2026-06-11T15:00:00Z' },
      ],
      '2026-06-11',
      1,
    )
    expect(days).toEqual([{ date: '2026-06-11', mg: 360 }])
  })

  it('histórico de 7 días en orden cronológico, con días a cero', () => {
    const days = caffeineByDay(
      [{ method: 'v60', doseG: 15, brewedAt: '2026-06-09' }],
      '2026-06-11',
      7,
    )
    expect(days).toHaveLength(7)
    expect(days.at(-1)!.date).toBe('2026-06-11')
    expect(days.find((d) => d.date === '2026-06-09')!.mg).toBe(150)
    expect(days.filter((d) => d.mg === 0)).toHaveLength(6)
  })
})
