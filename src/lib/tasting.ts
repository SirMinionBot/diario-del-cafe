// Cata sensorial (spec tasting-notes): tipos, rueda de sabores y validador.
// ÚNICA puerta de lectura/escritura del jsonb `brews.tasting` (design D2):
// nada debe persistir o pintar una cata sin pasar por parseTasting.

export const TASTING_AXES = ['acidez', 'cuerpo', 'dulzor', 'amargor'] as const
export type TastingAxis = (typeof TASTING_AXES)[number]

/** Rueda de descriptores por familias (vocabulario cerrado, estilo SCA simplificado). */
export const FLAVOR_WHEEL = {
  frutal: ['cítrico', 'baya', 'fruta de hueso', 'tropical', 'manzana'],
  floral: ['jazmín', 'rosa', 'té negro'],
  dulce: ['caramelo', 'miel', 'vainilla', 'chocolate'],
  'frutos secos': ['nuez', 'almendra', 'cacao'],
  especiado: ['canela', 'clavo', 'pimienta'],
  tostado: ['pan tostado', 'cereal', 'ahumado'],
} as const satisfies Record<string, readonly string[]>

export const ALL_DESCRIPTORS: string[] = Object.values(FLAVOR_WHEEL).flat()

export type Tasting = {
  acidez: number
  cuerpo: number
  dulzor: number
  amargor: number
  descriptores: string[]
}

function isAxisValue(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5
}

/** Valida un valor desconocido (p. ej. el jsonb de BD). Devuelve null si no es una cata válida. */
export function parseTasting(x: unknown): Tasting | null {
  if (typeof x !== 'object' || x === null) return null
  const t = x as Record<string, unknown>
  if (!TASTING_AXES.every((axis) => isAxisValue(t[axis]))) return null
  if (!Array.isArray(t.descriptores)) return null
  if (!t.descriptores.every((d) => typeof d === 'string' && ALL_DESCRIPTORS.includes(d))) return null
  return {
    acidez: t.acidez as number,
    cuerpo: t.cuerpo as number,
    dulzor: t.dulzor as number,
    amargor: t.amargor as number,
    descriptores: t.descriptores as string[],
  }
}

export type TastingProfile = {
  ejes: Record<TastingAxis, number>
  /** descriptores más repetidos, de más a menos frecuente */
  topDescriptores: string[]
  catas: number
}

/** Perfil sensorial agregado de un café a partir de sus catas. */
export function aggregateTastings(tastings: Tasting[]): TastingProfile | null {
  if (tastings.length === 0) return null
  const ejes = Object.fromEntries(
    TASTING_AXES.map((axis) => [
      axis,
      Math.round((tastings.reduce((sum, t) => sum + t[axis], 0) / tastings.length) * 10) / 10,
    ]),
  ) as Record<TastingAxis, number>

  const freq = new Map<string, number>()
  for (const t of tastings) {
    for (const d of t.descriptores) freq.set(d, (freq.get(d) ?? 0) + 1)
  }
  const topDescriptores = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([d]) => d)

  return { ejes, topDescriptores, catas: tastings.length }
}
