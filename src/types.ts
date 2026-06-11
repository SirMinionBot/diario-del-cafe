// Filas de las tablas de Supabase (snake_case como en BD).

import type { MethodId } from './lib/methods.ts'

export type Coffee = {
  id: string
  name: string
  roaster: string | null
  origin: string | null
  roast_level: 'claro' | 'medio' | 'oscuro' | null
  price_per_kg: number | null
  notes: string | null
  archived_at: string | null
  created_at: string
}

export type CoffeeBag = {
  id: string
  coffee_id: string
  roast_date: string
  weight_g: number
  opened_at: string | null
  finished_at: string | null
  created_at: string
}

export type Recipe = {
  id: string
  coffee_id: string
  method: MethodId
  ratio: number
  dose_g: number
  grind_setting: string | null
  water_temp_c: number | null
  target_time_s: number | null
  notes: string | null
}

export type TasteLabelDb = 'acido' | 'equilibrado' | 'amargo'

export type Brew = {
  id: string
  coffee_id: string
  bag_id: string | null
  recipe_id: string | null
  method: MethodId
  dose_g: number
  water_g: number | null
  grind_setting: string | null
  water_temp_c: number | null
  time_s: number | null
  rating: number | null
  taste_label: TasteLabelDb | null
  tasting: unknown
  notes: string | null
  photo_path: string | null
  brewed_at: string
}
