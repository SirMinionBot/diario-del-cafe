// Geometría del radar sensorial de 4 ejes (delta recipe-sharing): única
// fuente para el SVG del comparador y el canvas de la tarjeta, de modo que
// ambos pinten idéntico. Acidez arriba, cuerpo derecha, dulzor abajo,
// amargor izquierda; escala 1–5.

import { TASTING_AXES, type Tasting, type TastingAxis } from './tasting.ts'

const ANGLES = [-90, 0, 90, 180].map((deg) => (deg * Math.PI) / 180)

export type Point = { x: number; y: number }

export function axisPoint(axisIndex: number, value: number, cx: number, cy: number, r: number): Point {
  const scaled = (value / 5) * r
  return {
    x: cx + Math.cos(ANGLES[axisIndex]) * scaled,
    y: cy + Math.sin(ANGLES[axisIndex]) * scaled,
  }
}

/** Polígono de una cata (orden TASTING_AXES). */
export function tastingPolygon(t: Tasting, cx: number, cy: number, r: number): Point[] {
  return TASTING_AXES.map((axis: TastingAxis, i) => axisPoint(i, t[axis], cx, cy, r))
}

/** Anillo de referencia para un nivel 1–5. */
export function ringPolygon(level: number, cx: number, cy: number, r: number): Point[] {
  return TASTING_AXES.map((_, i) => axisPoint(i, level, cx, cy, r))
}

export const RADAR_AXIS_LABELS: { label: TastingAxis; dx: number; dy: number }[] = [
  { label: 'acidez', dx: 0, dy: -1 },
  { label: 'cuerpo', dx: 1, dy: 0 },
  { label: 'dulzor', dx: 0, dy: 1 },
  { label: 'amargor', dx: -1, dy: 0 },
]
