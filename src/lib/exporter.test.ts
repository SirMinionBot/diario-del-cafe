import { describe, expect, it } from 'vitest'
import { brewsToCsv, buildBackup, remapBackup, validateBackup, type BackupV1 } from './exporter.ts'
import type { Brew, Coffee } from '../types.ts'

const coffee = {
  id: 'c1', name: 'Etiopía, "la natural"', roaster: null, origin: null,
  roast_level: null, price_per_kg: null, notes: null, archived_at: null,
  created_at: '2026-06-01',
} satisfies Coffee

const brew = {
  id: 'b1', coffee_id: 'c1', bag_id: 'bag1', recipe_id: null, method: 'espresso',
  dose_g: 18, water_g: 36, grind_setting: null, grinder_id: null, grind_value: null, water_temp_c: null, time_s: 27,
  rating: 4, taste_label: null, tasting: null, notes: null, photo_path: null,
  brewed_at: '2026-06-11T08:00:00Z',
} satisfies Brew

function backup(): BackupV1 {
  return buildBackup(
    {
      coffees: [coffee],
      coffee_bags: [{ id: 'bag1', coffee_id: 'c1', roast_date: '2026-06-01', weight_g: 250, opened_at: null, finished_at: null, created_at: '2026-06-02' }],
      recipes: [{ id: 'r1', coffee_id: 'c1', method: 'espresso', ratio: 2, dose_g: 18, grind_setting: null, grinder_id: 'g1', grind_value: 14, water_temp_c: null, target_time_s: null, notes: null }],
      grinders: [{ id: 'g1', name: 'C40', min_setting: 0, max_setting: 40, step: 1 }],
      brews: [brew],
    },
    '2026-06-11T12:00:00Z',
  )
}

describe('backup JSON (spec data-export)', () => {
  it('buildBackup produce versión 1 con todas las entidades', () => {
    const b = backup()
    expect(b.version).toBe(1)
    expect(b.coffees).toHaveLength(1)
    expect(b.brews).toHaveLength(1)
  })

  it('validateBackup acepta el formato propio', () => {
    const r = validateBackup(JSON.parse(JSON.stringify(backup())))
    expect(r.ok).toBe(true)
  })

  it('rechaza versión desconocida, estructura rota y catas inválidas', () => {
    expect(validateBackup({ version: 2 }).ok).toBe(false)
    expect(validateBackup({ ...backup(), brews: 'no' }).ok).toBe(false)
    const conCataMala = backup()
    conCataMala.brews[0] = { ...brew, tasting: { acidez: 9 } }
    const r = validateBackup(JSON.parse(JSON.stringify(conCataMala)))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.field).toBe('brews.tasting')
  })
})

describe('remapBackup', () => {
  it('regenera ids, remapea referencias y elimina user_id/created_at', () => {
    let n = 0
    const out = remapBackup(backup(), () => `new-${++n}`)
    const newCoffeeId = out.coffees[0].id as string
    expect(newCoffeeId).toMatch(/^new-/)
    expect(out.coffee_bags[0].coffee_id).toBe(newCoffeeId)
    expect(out.brews[0].coffee_id).toBe(newCoffeeId)
    expect(out.brews[0].bag_id).toBe(out.coffee_bags[0].id)
    expect(out.brews[0]).not.toHaveProperty('created_at')
    expect(out.coffees[0]).not.toHaveProperty('user_id')
  })

  it('referencias a entidades ausentes quedan null', () => {
    const b = backup()
    b.coffee_bags = [] // el brew apunta a un bag que ya no viaja
    let n = 0
    const out = remapBackup(b, () => `new-${++n}`)
    expect(out.brews[0].bag_id).toBeNull()
  })
})

describe('brewsToCsv', () => {
  it('una fila por brew con el nombre del café y escapado CSV', () => {
    const csv = brewsToCsv([brew], [coffee])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^fecha,cafe,metodo/)
    expect(lines[1]).toContain('"Etiopía, ""la natural"""')
    expect(lines[1]).toContain('espresso')
  })
})
