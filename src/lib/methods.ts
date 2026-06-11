// Catálogo ESTÁTICO de métodos de preparación (design D1).
// Conocimiento universal versionado con el código: el usuario no edita estos
// defaults, los sobrescribe con sus recetas (tabla `recipes`).

export type MethodId = 'espresso' | 'v60' | 'prensa' | 'aeropress' | 'moka' | 'coldbrew'

export type MethodFamily = 'espresso' | 'filtro' | 'inmersion'

export type BrewPhase = {
  name: string
  /** duración orientativa de la fase, en segundos */
  durationS: number
  /** % del agua total que debe estar vertida al TERMINAR la fase (acumulado) */
  waterPctEnd: number
}

export type BrewMethod = {
  id: MethodId
  name: string
  family: MethodFamily
  /** gramos de agua (o de bebida en taza, para espresso) por gramo de café */
  ratio: number
  waterTempC: number
  /** rango de tiempo objetivo en segundos */
  targetTimeS: { min: number; max: number }
  /** dosis de partida sugerida, en gramos de café */
  defaultDoseG: number
  /** fases guiadas para el cronómetro (solo métodos de vertido) */
  phases?: BrewPhase[]
}

export const METHODS: Record<MethodId, BrewMethod> = {
  espresso: {
    id: 'espresso',
    name: 'Espresso',
    family: 'espresso',
    ratio: 2,
    waterTempC: 93,
    targetTimeS: { min: 25, max: 30 },
    defaultDoseG: 18,
  },
  v60: {
    id: 'v60',
    name: 'V60',
    family: 'filtro',
    ratio: 16,
    waterTempC: 94,
    targetTimeS: { min: 150, max: 210 },
    defaultDoseG: 15,
    phases: [
      { name: 'Bloom', durationS: 45, waterPctEnd: 15 },
      { name: 'Primer vertido', durationS: 45, waterPctEnd: 60 },
      { name: 'Segundo vertido', durationS: 45, waterPctEnd: 100 },
    ],
  },
  prensa: {
    id: 'prensa',
    name: 'Prensa francesa',
    family: 'inmersion',
    ratio: 15,
    waterTempC: 95,
    targetTimeS: { min: 240, max: 300 },
    defaultDoseG: 20,
  },
  aeropress: {
    id: 'aeropress',
    name: 'AeroPress',
    family: 'inmersion',
    ratio: 14,
    waterTempC: 85,
    targetTimeS: { min: 90, max: 150 },
    defaultDoseG: 14,
  },
  moka: {
    id: 'moka',
    name: 'Moka',
    family: 'espresso',
    ratio: 10,
    waterTempC: 95,
    targetTimeS: { min: 180, max: 300 },
    defaultDoseG: 15,
  },
  coldbrew: {
    id: 'coldbrew',
    name: 'Cold brew',
    family: 'inmersion',
    ratio: 8,
    waterTempC: 20,
    targetTimeS: { min: 12 * 3600, max: 18 * 3600 },
    defaultDoseG: 60,
  },
}

export const METHOD_LIST: BrewMethod[] = Object.values(METHODS)
