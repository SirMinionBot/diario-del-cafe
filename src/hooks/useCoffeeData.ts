import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { Coffee, Recipe } from '../types.ts'

type Snapshot = { coffees: Coffee[]; recipes: Recipe[] }

async function fetchCoffeeData(): Promise<Snapshot> {
  const [c, r] = await Promise.all([
    supabase.from('coffees').select('*').is('archived_at', null).order('name'),
    supabase.from('recipes').select('*'),
  ])
  return {
    coffees: (c.data as Coffee[] | null) ?? [],
    recipes: (r.data as Recipe[] | null) ?? [],
  }
}

/** Cafés activos del usuario y sus recetas. Lecturas cacheadas por el SW (offline). */
export function useCoffeeData() {
  const [state, setState] = useState<Snapshot & { loading: boolean }>({
    coffees: [],
    recipes: [],
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
