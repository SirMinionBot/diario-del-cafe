import { describe, expect, it } from 'vitest'
import { axisPoint, ringPolygon, tastingPolygon } from './radar.ts'

describe('radar (geometría compartida comparador/tarjeta)', () => {
  it('acidez 5 apunta recto hacia arriba; cuerpo 5 a la derecha', () => {
    const up = axisPoint(0, 5, 100, 100, 80)
    expect(up.x).toBeCloseTo(100)
    expect(up.y).toBeCloseTo(20)
    const right = axisPoint(1, 5, 100, 100, 80)
    expect(right.x).toBeCloseTo(180)
    expect(right.y).toBeCloseTo(100)
  })

  it('el polígono de una cata escala por valor/5', () => {
    const pts = tastingPolygon(
      { acidez: 5, cuerpo: 1, dulzor: 5, amargor: 1, descriptores: [] },
      0, 0, 100,
    )
    expect(pts[0].y).toBeCloseTo(-100) // acidez 5
    expect(pts[1].x).toBeCloseTo(20) // cuerpo 1
    expect(pts[2].y).toBeCloseTo(100) // dulzor 5
    expect(pts[3].x).toBeCloseTo(-20) // amargor 1
  })

  it('el anillo de nivel N es regular', () => {
    const ring = ringPolygon(3, 0, 0, 100)
    for (const p of ring) expect(Math.hypot(p.x, p.y)).toBeCloseTo(60)
  })
})
