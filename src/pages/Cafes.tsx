import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { daysSinceRoast, freshnessState, FRESHNESS_LABEL } from '../lib/freshness.ts'
import type { Coffee, CoffeeBag } from '../types.ts'

type Snapshot = { coffees: Coffee[]; bags: CoffeeBag[] }

async function fetchCatalog(): Promise<Snapshot> {
  const [c, b] = await Promise.all([
    supabase.from('coffees').select('*').is('archived_at', null).order('name'),
    supabase.from('coffee_bags').select('*').is('finished_at', null),
  ])
  return {
    coffees: (c.data as Coffee[] | null) ?? [],
    bags: (b.data as CoffeeBag[] | null) ?? [],
  }
}

const FRESHNESS_COLOR = {
  reposo: 'text-warn',
  optimo: 'text-leaf',
  pasado: 'text-danger',
} as const

export default function Cafes() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let cancelled = false
    void fetchCatalog().then((s) => {
      if (!cancelled) setSnap(s)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <p className="uppercase text-xs text-copper">catálogo e inventario</p>
          <h1 className="mt-1 text-3xl">Cafés</h1>
        </div>
        <Link
          to="/cafes/nuevo"
          className="press rounded-xl bg-caramel px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Nuevo
        </Link>
      </div>

      {snap && snap.coffees.length === 0 && (
        <div className="card mt-6 p-4 text-sm text-ink/70">
          Aún no tienes cafés. Añade tu primera marca y guarda sus ratios.
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {snap?.coffees.map((coffee) => {
          // frescura del paquete activo más reciente (familia filtro como referencia)
          const bag = snap.bags
            .filter((b) => b.coffee_id === coffee.id)
            .sort((a, b) => b.roast_date.localeCompare(a.roast_date))[0]
          const days = bag ? daysSinceRoast(bag.roast_date, today) : null
          const state = days !== null ? freshnessState(days, 'filtro') : null
          return (
            <li key={coffee.id}>
              <Link to={`/cafes/${coffee.id}`} className="card press block p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-xl">{coffee.name}</h2>
                  {coffee.price_per_kg && (
                    <span className="shrink-0 text-sm text-ink/60" data-numeric>
                      {coffee.price_per_kg} €/kg
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-ink/60">
                  {[coffee.roaster, coffee.origin, coffee.roast_level].filter(Boolean).join(' · ') ||
                    'Sin detalles'}
                </p>
                {state !== null && days !== null && (
                  <p className={`mt-1.5 text-xs font-semibold ${FRESHNESS_COLOR[state]}`}>
                    {FRESHNESS_LABEL[state]} · día {days} desde tueste
                  </p>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
