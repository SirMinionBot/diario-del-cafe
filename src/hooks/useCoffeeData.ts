import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { Coffee, CoffeeBag, Grinder, Recipe } from '../types.ts'

type Snapshot = { coffees: Coffee[]; recipes: Recipe[]; bags: CoffeeBag[]; grinders: Grinder[] }

async function fetchCoffeeData(): Promise<Snapshot> {
  const [c, r, b, g] = await Promise.all([
    supabase.from('coffees').select('*').is('archived_at', null).order('name'),
    supabase.from('recipes').select('*'),
    supabase.from('coffee_bags').select('*').is('finished_at', null),
    supabase.from('grinders').select('*').order('name'),
  ])
  return {
    coffees: (c.data as Coffee[] | null) ?? [],
    recipes: (r.data as Recipe[] | null) ?? [],
    bags: (b.data as CoffeeBag[] | null) ?? [],
    grinders: (g.data as Grinder[] | null) ?? [],
  }
}

/** Cafés activos, recetas, paquetes activos y molinillos. Cacheado por el SW (offline). */
export function useCoffeeData() {
  const [state, setState] = useState<Snapshot & { loading: boolean }>({
    coffees: [],
    recipes: [],
    bags: [],
    grinders: [],
    loading: true,
  })

  const refresh = useCallback(async () => {
    const snap = await fetchCoffeeData()
    setState({ ...snap, loading: false })
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetchCoffeeData().then((snap) => {
      if (!cancelled) setState({ ...snap, loading: false })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { ...state, refresh }
}
