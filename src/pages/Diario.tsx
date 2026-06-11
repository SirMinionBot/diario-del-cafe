import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { useOfflineSync } from '../hooks/useOfflineSync.ts'
import { openBrewQueue, type PendingBrew } from '../lib/offlineQueue.ts'
import CoffeeSelect from '../components/CoffeeSelect.tsx'
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
  const navigate = useNavigate()
  const { pendingCount } = useOfflineSync()
  // modo comparar: seleccionar exactamente dos (spec brew-compare)
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const queuedBanner = (useLocation().state as { queued?: boolean; photoSkipped?: boolean } | null)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [pending, setPending] = useState<PendingBrew[]>([])
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [coffeeFilter, setCoffeeFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState<'' | MethodId>('')

  // pendientes locales mezclados con marca visual (spec offline-sync)
  useEffect(() => {
    let cancelled = false
    void openBrewQueue().then(async (q) => {
      const items = q ? await q.all() : []
      if (!cancelled) setPending(items.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt)))
    })
    return () => {
      cancelled = true
    }
  }, [pendingCount])

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

  const coffeeById = useMemo(
    () => new Map(snap?.coffees.map((c) => [c.id, c]) ?? []),
    [snap],
  )
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
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCompareMode(!compareMode)
              setSelected([])
            }}
            className={`press rounded-xl px-3 py-2.5 text-sm font-semibold ${
              compareMode ? 'bg-ink text-paper' : 'card text-ink/70'
            }`}
          >
            ⚖
          </button>
          <Link to="/diario/nueva"
            className="press rounded-xl bg-caramel px-4 py-2.5 text-sm font-semibold text-white">
            + Registrar
          </Link>
        </div>
      </div>

      {compareMode && (
        <div className="card mt-3 flex items-center justify-between p-3 text-sm">
          <span>{selected.length}/2 seleccionadas</span>
          <button
            disabled={selected.length !== 2}
            onClick={() => navigate(`/diario/comparar?a=${selected[0]}&b=${selected[1]}`)}
            className="press rounded-lg bg-caramel px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Comparar
          </button>
        </div>
      )}

      {queuedBanner?.queued && (
        <div className="card mt-3 border-warn/40 bg-crema/40 p-3 text-sm">
          ✓ Guardada <strong>pendiente de sincronizar</strong>: se subirá al recuperar conexión.
          {queuedBanner.photoSkipped && ' La foto no pudo adjuntarse sin red.'}
        </div>
      )}
      {pendingCount > 0 && (
        <p className="mt-2 text-xs font-semibold text-warn" data-numeric>
          ⏳ {pendingCount} extracción{pendingCount === 1 ? '' : 'es'} pendiente{pendingCount === 1 ? '' : 's'} de sincronizar
        </p>
      )}

      {/* filtros por café y método (spec brew-log) */}
      <div className="mt-3 flex gap-2">
        <CoffeeSelect
          coffees={snap?.coffees ?? []}
          value={coffeeFilter}
          onChange={setCoffeeFilter}
          emptyLabel="Todos los cafés"
          className="card min-w-0 flex-1 px-2 py-2 text-sm"
        />
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
        {pending.map((p) => {
          const pl = p.payload as { coffee_id?: string; method?: string; dose_g?: number }
          return (
            <li key={p.id} className="card flex gap-3 border-dashed p-3 opacity-80">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-semibold">
                    {(pl.coffee_id && coffeeName.get(pl.coffee_id)) ?? '—'}
                  </p>
                  <span className="shrink-0 rounded-full bg-warn/15 px-2 py-0.5 text-xs font-semibold text-warn">
                    pendiente
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink/70" data-numeric>
                  {(pl.method && METHODS[pl.method as MethodId]?.name) ?? pl.method} · {pl.dose_g} g
                </p>
              </div>
            </li>
          )
        })}
        {filtered.map((brew) => {
          const ratio = brew.water_g ? ratioFor(brew.dose_g, brew.water_g) : null
          const isSelected = selected.includes(brew.id)
          return (
            <li
              key={brew.id}
              onClick={() => {
                if (!compareMode) return
                setSelected(
                  isSelected
                    ? selected.filter((id) => id !== brew.id)
                    : selected.length < 2
                      ? [...selected, brew.id]
                      : selected,
                )
              }}
              className={`card flex gap-3 p-3 ${compareMode ? 'press cursor-pointer' : ''} ${
                isSelected ? 'border-caramel ring-2 ring-caramel/40' : ''
              }`}
            >
              {brew.photo_path && thumbs[brew.photo_path] && (
                <img src={thumbs[brew.photo_path]} alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-semibold">
                    {coffeeName.get(brew.coffee_id) ?? '—'}
                    {coffeeById.get(brew.coffee_id)?.roaster && (
                      <span className="font-normal text-ink/45"> · {coffeeById.get(brew.coffee_id)!.roaster}</span>
                    )}
                  </p>
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
