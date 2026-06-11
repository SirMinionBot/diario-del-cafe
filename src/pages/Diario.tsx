import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { METHODS, METHOD_LIST, type MethodId } from '../lib/methods.ts'
import { formatRatio, ratioFor } from '../lib/ratio.ts'
import { formatTime } from '../lib/timer.ts'
import type { Brew, Coffee } from '../types.ts'

type Snapshot = { brews: Brew[]; coffees: Coffee[] }

async function fetchDiary(): Promise<Snapshot> {
  const [b, c] = await Promise.all([
    supabase.from('brews').select('*').order('brewed_at', { ascending: false }).limit(100),
    supabase.from('coffees').select('*'),
  ])
  return {
    brews: (b.data as Brew[] | null) ?? [],
    coffees: (c.data as Coffee[] | null) ?? [],
  }
}

export default function Diario() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [coffeeFilter, setCoffeeFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState<'' | MethodId>('')

  useEffect(() => {
    let cancelled = false
    void fetchDiary().then(async (s) => {
      if (cancelled) return
      setSnap(s)
      // miniaturas: URLs firmadas en lote para el bucket privado
      const paths = s.brews.map((b) => b.photo_path).filter((p): p is string => p !== null)
      if (paths.length === 0) return
      const { data } = await supabase.storage.from('brew-photos').createSignedUrls(paths, 3600)
      if (cancelled || !data) return
      setThumbs(
        Object.fromEntries(
          data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])),
        ),
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  const coffeeName = useMemo(
    () => new Map(snap?.coffees.map((c) => [c.id, c.name]) ?? []),
    [snap],
  )

  const filtered = (snap?.brews ?? []).filter(
    (b) =>
      (!coffeeFilter || b.coffee_id === coffeeFilter) &&
      (!methodFilter || b.method === methodFilter),
  )

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <p className="uppercase text-xs text-copper">extracciones y catas</p>
          <h1 className="mt-1 text-3xl">Diario</h1>
        </div>
        <Link to="/diario/nueva"
          className="press rounded-xl bg-caramel px-4 py-2.5 text-sm font-semibold text-white">
          + Registrar
        </Link>
      </div>

      {/* filtros por café y método (spec brew-log) */}
      <div className="mt-3 flex gap-2">
        <select value={coffeeFilter} onChange={(e) => setCoffeeFilter(e.target.value)}
          className="card flex-1 px-2 py-2 text-sm">
          <option value="">Todos los cafés</option>
          {snap?.coffees.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as '' | MethodId)}
          className="card flex-1 px-2 py-2 text-sm">
          <option value="">Todos los métodos</option>
          {METHOD_LIST.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {snap && filtered.length === 0 && (
        <div className="card mt-4 p-4 text-sm text-ink/70">
          {snap.brews.length === 0
            ? 'Aún no hay extracciones. Prepara un café y registra el resultado.'
            : 'Nada con esos filtros.'}
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {filtered.map((brew) => {
          const ratio = brew.water_g ? ratioFor(brew.dose_g, brew.water_g) : null
          return (
            <li key={brew.id} className="card flex gap-3 p-3">
              {brew.photo_path && thumbs[brew.photo_path] && (
                <img src={thumbs[brew.photo_path]} alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-semibold">{coffeeName.get(brew.coffee_id) ?? '—'}</p>
                  <span className="shrink-0 text-xs text-ink/50">
                    {brew.brewed_at.slice(0, 10)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink/70" data-numeric>
                  {METHODS[brew.method]?.name ?? brew.method} · {brew.dose_g} g
                  {ratio && <> · {formatRatio(ratio)}</>}
                  {brew.time_s && <> · {formatTime(brew.time_s)}</>}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {brew.rating && <span>{'⭐'.repeat(brew.rating)}</span>}
                  {brew.taste_label && (
                    <span className="rounded-full bg-crema/70 px-2 py-0.5 capitalize text-ink/70">
                      {brew.taste_label}
                    </span>
                  )}
                </div>
                {brew.notes && <p className="mt-1 truncate text-xs text-ink/50">{brew.notes}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
