import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { caffeineByDay } from '../lib/caffeine.ts'
import { monthlySpend, rankByValue, rankCoffees } from '../lib/stats.ts'
import type { MethodId } from '../lib/methods.ts'

type Snapshot = {
  coffees: { id: string; name: string; price_per_kg: number | null }[]
  bags: { coffee_id: string; weight_g: number; created_at: string }[]
  brews: { coffee_id: string; method: MethodId; dose_g: number; rating: number | null; brewed_at: string }[]
}

async function fetchStats(): Promise<Snapshot> {
  const [c, b, w] = await Promise.all([
    supabase.from('coffees').select('id, name, price_per_kg'),
    supabase.from('coffee_bags').select('coffee_id, weight_g, created_at'),
    supabase.from('brews').select('coffee_id, method, dose_g, rating, brewed_at'),
  ])
  return {
    coffees: (c.data as Snapshot['coffees'] | null) ?? [],
    bags: (b.data as Snapshot['bags'] | null) ?? [],
    brews: (w.data as Snapshot['brews'] | null) ?? [],
  }
}

export default function Perfil() {
  const { session } = useAuth()
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [rankMode, setRankMode] = useState<'rating' | 'value'>('rating')
  const today = new Date().toISOString().slice(0, 10)
  const month = today.slice(0, 7)

  useEffect(() => {
    let cancelled = false
    void fetchStats().then((s) => {
      if (!cancelled) setSnap(s)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const week = snap ? caffeineByDay(snap.brews.map((b) => ({ method: b.method, doseG: b.dose_g, brewedAt: b.brewed_at })), today, 7) : []
  const todayMg = week.at(-1)?.mg ?? 0
  const maxMg = Math.max(1, ...week.map((d) => d.mg))

  const spend = snap
    ? monthlySpend(
        snap.coffees.map((c) => ({ id: c.id, name: c.name, pricePerKg: c.price_per_kg })),
        snap.bags.map((b) => ({ coffeeId: b.coffee_id, weightG: b.weight_g, createdAt: b.created_at })),
        month,
      )
    : null

  const ranked = snap
    ? rankCoffees(
        snap.coffees.map((c) => ({ id: c.id, name: c.name, pricePerKg: c.price_per_kg })),
        snap.brews.map((b) => ({ coffeeId: b.coffee_id, rating: b.rating })),
      )
    : []
  const shown = rankMode === 'value' ? rankByValue(ranked) : ranked
  const excludedFromValue = rankMode === 'value' ? ranked.length - shown.length : 0

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="uppercase text-xs text-copper">estadísticas y cuenta</p>
        <h1 className="mt-1 text-3xl">Perfil</h1>
      </div>

      {/* ─── cafeína estimada (spec consumption-stats) ─── */}
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <p className="uppercase text-xs text-copper">cafeína · estimación</p>
          <p className="text-sm" data-numeric>
            hoy <strong>{todayMg} mg</strong>
          </p>
        </div>
        <div className="mt-3 flex h-20 items-end gap-1.5">
          {week.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t ${d.date === today ? 'bg-copper' : 'bg-crema'}`}
                style={{ height: `${Math.max(4, (d.mg / maxMg) * 64)}px` }}
                title={`${d.mg} mg`}
              />
              <span className="text-[10px] text-ink/50">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink/45">
          Estimación según método y dosis; la cafeína real varía con el café y la extracción.
        </p>
      </div>

      {/* ─── gasto del mes, derivado de paquetes ─── */}
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <p className="uppercase text-xs text-copper">gasto · {month}</p>
          <p className="text-lg font-semibold" data-numeric>{spend?.totalEur ?? 0} €</p>
        </div>
        {spend && spend.byCoffee.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {spend.byCoffee.map((c) => (
              <li key={c.coffeeId} className="flex justify-between text-sm">
                <span className="truncate">{c.name}</span>
                <span data-numeric>{c.eur} €</span>
              </li>
            ))}
          </ul>
        )}
        {spend && spend.excludedBags > 0 && (
          <p className="mt-2 text-[11px] text-warn" data-numeric>
            {spend.excludedBags} paquete{spend.excludedBags === 1 ? '' : 's'} sin precio/kg fuera del cálculo.
          </p>
        )}
      </div>

      {/* ─── ranking de cafés (spec brand-ranking) ─── */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <p className="uppercase text-xs text-copper">tu podio</p>
          <div className="flex rounded-lg bg-crema/60 p-0.5 text-xs font-semibold">
            <button onClick={() => setRankMode('rating')}
              className={`press rounded-md px-2.5 py-1 ${rankMode === 'rating' ? 'bg-card' : 'text-ink/50'}`}>
              Nota
            </button>
            <button onClick={() => setRankMode('value')}
              className={`press rounded-md px-2.5 py-1 ${rankMode === 'value' ? 'bg-card' : 'text-ink/50'}`}>
              Precio/calidad
            </button>
          </div>
        </div>
        <ol className="mt-2 flex flex-col gap-1.5">
          {shown.map((c, i) => (
            <li key={c.coffeeId} className="flex items-center justify-between text-sm">
              <span className="truncate">
                <span className="mr-1.5 text-ink/40" data-numeric>{i + 1}.</span>
                {c.name}
              </span>
              {c.avgRating !== null ? (
                <span className="shrink-0" data-numeric>
                  ⭐ {c.avgRating}
                  <span className="ml-1 text-xs text-ink/40">({c.brewCount})</span>
                </span>
              ) : (
                <span className="shrink-0 text-xs text-ink/40">sin valorar</span>
              )}
            </li>
          ))}
        </ol>
        {excludedFromValue > 0 && (
          <p className="mt-2 text-[11px] text-ink/45" data-numeric>
            {excludedFromValue} café{excludedFromValue === 1 ? '' : 's'} sin precio o sin nota, fuera de esta ordenación.
          </p>
        )}
        {shown.length === 0 && <p className="mt-2 text-sm text-ink/60">Valora extracciones para ver tu podio.</p>}
      </div>

      {/* ─── cuenta ─── */}
      <div className="card p-4">
        <p className="text-sm text-ink/70">Sesión iniciada como</p>
        <p className="mt-0.5 truncate font-medium">{session?.user.email}</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="press mt-4 w-full rounded-xl border hairline py-2.5 text-sm font-semibold text-danger"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  )
}
