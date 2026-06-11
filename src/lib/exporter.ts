// Backup propio (spec data-export, design D3): JSON v1 + CSV de brews.
// El import valida estrictamente, regenera TODOS los ids y remapea las
// referencias — un backup es importable en cualquier cuenta sin colisiones.

import { parseTasting } from './tasting.ts'
import type { Brew, Coffee, CoffeeBag, Recipe } from '../types.ts'

export type GrinderRow = {
  id: string
  name: string
  min_setting: number | null
  max_setting: number | null
  step: number | null
}

export type BackupV1 = {
  version: 1
  exportedAt: string
  coffees: Coffee[]
  coffee_bags: CoffeeBag[]
  recipes: Recipe[]
  grinders: GrinderRow[]
  brews: Brew[]
}

export function buildBackup(
  data: Omit<BackupV1, 'version' | 'exportedAt'>,
  exportedAt: string,
): BackupV1 {
  return { version: 1, exportedAt, ...data }
}

// ─── CSV de brews ─────────────────────────────────────────────────────────────

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export function brewsToCsv(brews: Brew[], coffees: Pick<Coffee, 'id' | 'name'>[]): string {
  const names = new Map(coffees.map((c) => [c.id, c.name]))
  const header = 'fecha,cafe,metodo,dosis_g,agua_g,tiempo_s,molienda,valoracion,sabor,notas'
  const rows = brews.map((b) =>
    [
      b.brewed_at.slice(0, 10),
      names.get(b.coffee_id) ?? '',
      b.method,
      b.dose_g,
      b.water_g,
      b.time_s,
      b.grind_setting,
      b.rating,
      b.taste_label,
      b.notes,
    ]
      .map(csvCell)
      .join(','),
  )
  return [header, ...rows].join('\n')
}

// ─── validación e import ──────────────────────────────────────────────────────

export type ImportError = { field: string; detail: string }

function isRow(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

/** Validación estructural estricta antes de tocar la BD (design: riesgos). */
export function validateBackup(x: unknown): { ok: true; backup: BackupV1 } | { ok: false; error: ImportError } {
  if (!isRow(x)) return { ok: false, error: { field: 'raíz', detail: 'no es un objeto JSON' } }
  if (x.version !== 1) return { ok: false, error: { field: 'version', detail: 'versión no soportada' } }
  for (const key of ['coffees', 'coffee_bags', 'recipes', 'grinders', 'brews'] as const) {
    if (!Array.isArray(x[key])) return { ok: false, error: { field: key, detail: 'falta o no es lista' } }
    if (!(x[key] as unknown[]).every(isRow)) {
      return { ok: false, error: { field: key, detail: 'contiene entradas no válidas' } }
    }
  }
  const backup = x as unknown as BackupV1
  for (const c of backup.coffees) {
    if (typeof c.id !== 'string' || typeof c.name !== 'string' || !c.name) {
      return { ok: false, error: { field: 'coffees', detail: 'café sin id o sin nombre' } }
    }
  }
  for (const b of backup.brews) {
    if (typeof b.coffee_id !== 'string' || typeof b.dose_g !== 'number' || b.dose_g <= 0) {
      return { ok: false, error: { field: 'brews', detail: 'brew sin café o con dosis inválida' } }
    }
    if (b.tasting !== null && b.tasting !== undefined && parseTasting(b.tasting) === null) {
      return { ok: false, error: { field: 'brews.tasting', detail: 'cata con formato inválido' } }
    }
  }
  return { ok: true, backup }
}

export type RemappedBackup = {
  coffees: Record<string, unknown>[]
  coffee_bags: Record<string, unknown>[]
  recipes: Record<string, unknown>[]
  grinders: Record<string, unknown>[]
  brews: Record<string, unknown>[]
}

/**
 * Regenera ids y remapea referencias. Quita user_id/created_at: los pone la
 * BD (RLS default). Referencias a entidades ausentes del backup quedan null.
 */
export function remapBackup(backup: BackupV1, genId: () => string): RemappedBackup {
  const idMap = new Map<string, string>()
  const newId = (oldId: string) => {
    if (!idMap.has(oldId)) idMap.set(oldId, genId())
    return idMap.get(oldId)!
  }
  const ref = (oldId: string | null | undefined) =>
    oldId && idMap.has(oldId) ? idMap.get(oldId)! : null

  const strip = ({ ...row }: Record<string, unknown>) => {
    delete row.user_id
    delete row.created_at
    return row
  }

  // orden: primero entidades sin dependencias para poblar el idMap
  const coffees = backup.coffees.map((c) => strip({ ...c, id: newId(c.id) }))
  const grinders = backup.grinders.map((g) => strip({ ...g, id: newId(g.id) }))
  const coffee_bags = backup.coffee_bags.map((b) =>
    strip({ ...b, id: newId(b.id), coffee_id: ref(b.coffee_id) }),
  )
  const recipes = backup.recipes.map((r) => {
    const row = strip({ ...r, id: newId(r.id), coffee_id: ref(r.coffee_id) }) as Record<string, unknown>
    if ('grinder_id' in row) row.grinder_id = ref(row.grinder_id as string | null)
    return row
  })
  const brews = backup.brews.map((b) => {
    const row = strip({
      ...b,
      id: newId(b.id),
      coffee_id: ref(b.coffee_id),
      bag_id: ref(b.bag_id),
      recipe_id: ref(b.recipe_id),
    }) as Record<string, unknown>
    if ('grinder_id' in row) row.grinder_id = ref(row.grinder_id as string | null)
    return row
  })

  return { coffees, grinders, coffee_bags, recipes, brews }
}
