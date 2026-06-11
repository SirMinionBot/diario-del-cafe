// Recetas de referencia (spec reference-recipes, design D6): catálogo
// ESTÁTICO de solo lectura, como el de métodos. «Usar» precarga Preparar;
// «guardar para un café» forkea a `recipes` del usuario.

import type { BrewPhase, MethodId } from './methods.ts'

export type ReferenceRecipe = {
  id: string
  name: string
  author: string
  methodId: MethodId
  ratio: number
  doseG: number
  waterTempC: number
  targetTimeS?: number
  phases?: BrewPhase[]
  source: string
}

export const REFERENCE_RECIPES: ReferenceRecipe[] = [
  {
    id: 'hoffmann-v60',
    name: 'V60 de una taza',
    author: 'James Hoffmann',
    methodId: 'v60',
    ratio: 16.7, // 15 g : 250 g
    doseG: 15,
    waterTempC: 95,
    targetTimeS: 180,
    phases: [
      { name: 'Bloom y remover', durationS: 45, waterPctEnd: 20 },
      { name: 'Vertido al 60 %', durationS: 25, waterPctEnd: 60 },
      { name: 'Vertido final y girar', durationS: 30, waterPctEnd: 100 },
    ],
    source: 'A Better 1 Cup V60 Technique (2022)',
  },
  {
    id: 'espresso-clasico',
    name: 'Espresso clásico 1:2',
    author: 'estándar de especialidad',
    methodId: 'espresso',
    ratio: 2,
    doseG: 18,
    waterTempC: 93,
    targetTimeS: 28,
    source: 'ratio moderno de referencia (18 g → 36 g en 25–30 s)',
  },
  {
    id: 'rao-allonge',
    name: 'Espresso allongé 1:3',
    author: 'Scott Rao',
    methodId: 'espresso',
    ratio: 3,
    doseG: 18,
    waterTempC: 94,
    targetTimeS: 35,
    source: 'shots largos para tuestes claros',
  },
  {
    id: 'aeropress-campeonato',
    name: 'AeroPress estilo campeonato',
    author: 'inspirada en W.A.C.',
    methodId: 'aeropress',
    ratio: 13.3, // 15 g : 200 g
    doseG: 15,
    waterTempC: 85,
    targetTimeS: 120,
    source: 'receta corta de concurso: inmersión 1:45 + prensado suave',
  },
  {
    id: 'prensa-hoffmann',
    name: 'Prensa francesa sin prisa',
    author: 'James Hoffmann',
    methodId: 'prensa',
    ratio: 16.7, // 30 g : 500 g
    doseG: 30,
    waterTempC: 95,
    targetTimeS: 540, // 4 min reposo + espera; sin prensar a fondo
    source: 'The Ultimate French Press Technique (2020)',
  },
  {
    id: 'moka-clasica',
    name: 'Moka clásica',
    author: 'tradición italiana',
    methodId: 'moka',
    ratio: 10,
    doseG: 16,
    waterTempC: 95,
    targetTimeS: 240,
    source: 'agua precalentada, fuego medio, cortar al borboteo',
  },
  {
    id: 'coldbrew-concentrado',
    name: 'Cold brew concentrado 1:8',
    author: 'estándar de especialidad',
    methodId: 'coldbrew',
    ratio: 8,
    doseG: 60,
    waterTempC: 20,
    targetTimeS: 16 * 3600,
    source: 'molienda gruesa, 14–18 h en nevera, diluir al servir',
  },
]

export function referenceById(id: string): ReferenceRecipe | null {
  return REFERENCE_RECIPES.find((r) => r.id === id) ?? null
}
