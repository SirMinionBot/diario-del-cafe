import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { caffeineByDay } from '../lib/caffeine.ts'
import { monthlySpend, rankByValue, rankCoffees } from '../lib/stats.ts'
import { brewsToCsv, buildBackup, remapBackup, validateBackup, type BackupV1, type GrinderRow } from '../lib/exporter.ts'
import type { MethodId } from '../lib/methods.ts'
import type { Brew, Coffee, CoffeeBag, Recipe } from '../types.ts'

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Carga TODO lo del usuario para el backup (spec data-export). */
async function fetchAll(): Promise<Omit<BackupV1, 'version' | 'exportedAt'>> {
  const [c, b, r, g, w] = await Promise.all([
    supabase.from('coffees').select('*'),
    supabase.from('coffee_bags').select('*'),
    supabase.from('recipes').select('*'),
    supabase.from('grinders').select('*'),
    supabase.from('brews').select('*'),
  ])
  return {
    coffees: (c.data as Coffee[] | null) ?? [],
    coffee_bags: (b.data as CoffeeBag[] | null) ?? [],
    recipes: (r.data as Recipe[] | null) ?? [],
    grinders: (g.data as GrinderRow[] | null) ?? [],
    brews: (w.data as Brew[] | null) ?? [],
  }
}

type Snapshot = {
  coffees: { id: string; name: string; roaster: string | null; price_per_kg: number | null }[]
  bags: { coffee_id: string; weight_g: number; created_at: string }[]
  brews: { coffee_id: string; method: MethodId; dose_g: number; rating: number | null; brewed_at: string }[]
}

async function fetchStats(): Promise<Snapshot> {
  const [c, b, w] = await Promise.all([
    supabase.from('coffees').select('id, name, roaster, price_per_kg'),
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
  // los «sin valorar» no se listan: se agregan en un recuento (delta brand-ranking)
  const shown =
    rankMode === 'value' ? rankByValue(ranked) : ranked.filter((c) => c.avgRating !== null)
  const excludedFromValue = rankMode === 'value' ? ranked.length - shown.length : 0
  const unratedCount = rankMode === 'rating' ? ranked.length - shown.length : 0
  const roasterOf = new Map(snap?.coffees.map((c) => [c.id, c.roaster]) ?? [])

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
                {roasterOf.get(c.coffeeId) && (
                  <span className="text-ink/45"> · {roasterOf.get(c.coffeeId)}</span>
                )}
              </span>
              {c.avgRating !== null && (
                <span className="shrink-0" data-numeric>
                  ⭐ {c.avgRating}
                  <span className="ml-1 text-xs text-ink/40">({c.brewCount})</span>
                </span>
              )}
            </li>
          ))}
        </ol>
        {unratedCount > 0 && (
          <p className="mt-2 text-[11px] text-ink/45" data-numeric>
            {unratedCount} café{unratedCount === 1 ? '' : 's'} sin valorar aún.
          </p>
        )}
        {excludedFromValue > 0 && (
          <p className="mt-2 text-[11px] text-ink/45" data-numeric>
            {excludedFromValue} café{excludedFromValue === 1 ? '' : 's'} sin precio o sin nota, fuera de esta ordenación.
          </p>
        )}
        {shown.length === 0 && <p className="mt-2 text-sm text-ink/60">Valora extracciones para ver tu podio.</p>}
      </div>

      <BackupSection />

      {/* ─── molinillos ─── */}
      <Link to="/perfil/molinillos" className="card press flex items-center justify-between p-4">
        <span className="font-medium">⚙️ Mis molinillos</span>
        <span className="text-ink/40">→</span>
      </Link>

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

// ─── backup: exportar/importar (spec data-export) ─────────────────────────────

/** Borra TODO lo del usuario: fotos del bucket, cafés (cascada: paquetes,
 * recetas, brews) y molinillos. Solo se invoca tras validar el backup y
 * confirmar el reemplazo (spec data-export). */
async function wipeAll(userId: string) {
  const { data: files } = await supabase.storage.from('brew-photos').list(userId)
  if (files && files.length > 0) {
    await supabase.storage.from('brew-photos').remove(files.map((f) => `${userId}/${f.name}`))
  }
  // RLS limita a las filas propias; el filtro amplio es solo el requisito de supabase-js
  const { error: e1 } = await supabase.from('coffees').delete().gte('created_at', '1970-01-01')
  if (e1) throw new Error(`borrando cafés: ${e1.message}`)
  const { error: e2 } = await supabase.from('grinders').delete().gte('created_at', '1970-01-01')
  if (e2) throw new Error(`borrando molinillos: ${e2.message}`)
}

function BackupSection() {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [replace, setReplace] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function exportJson() {
    setBusy(true)
    const data = await fetchAll()
    const backup = buildBackup(data, new Date().toISOString())
    download(`diario-del-cafe-${backup.exportedAt.slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json')
    setBusy(false)
  }

  async function exportCsv() {
    setBusy(true)
    const data = await fetchAll()
    download(`brews-${new Date().toISOString().slice(0, 10)}.csv`, brewsToCsv(data.brews, data.coffees), 'text/csv')
    setBusy(false)
  }

  async function importJson(file: File) {
    setBusy(true)
    setMessage(null)
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const result = validateBackup(parsed)
      if (!result.ok) {
        // la validación SIEMPRE va antes que cualquier borrado (spec data-export)
        setMessage(`No se importó nada: ${result.error.field} — ${result.error.detail}`)
        return
      }
      if (replace) {
        const sure = window.confirm(
          'REEMPLAZAR: se borrarán TODOS tus datos actuales (cafés, paquetes, recetas, extracciones, molinillos y fotos) antes de importar. Esta acción no se puede deshacer. ¿Continuar?',
        )
        if (!sure) {
          setMessage('Reemplazo cancelado: no se borró ni se importó nada.')
          return
        }
        if (!session) throw new Error('sesión no disponible')
        await wipeAll(session.user.id)
      }
      const rows = remapBackup(result.backup, () => crypto.randomUUID())
      // orden por dependencias; ids regenerados → sin colisiones (design D3)
      for (const [table, list] of [
        ['coffees', rows.coffees],
        ['grinders', rows.grinders],
        ['coffee_bags', rows.coffee_bags],
        ['recipes', rows.recipes],
        ['brews', rows.brews],
      ] as const) {
        if (list.length === 0) continue
        const { error } = await supabase.from(table).insert(list)
        if (error) throw new Error(`${table}: ${error.message}`)
      }
      setMessage(
        `✓ ${replace ? 'Datos anteriores borrados. ' : ''}Importado: ${rows.coffees.length} cafés, ${rows.coffee_bags.length} paquetes, ${rows.recipes.length} recetas, ${rows.grinders.length} molinillos, ${rows.brews.length} extracciones.`,
      )
      setReplace(false)
    } catch (e) {
      setMessage(`Error al importar: ${e instanceof Error ? e.message : 'fichero ilegible'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-4">
      <p className="uppercase text-xs text-copper">tus datos</p>
      <div className="mt-2 flex gap-2">
        <button onClick={exportJson} disabled={busy}
          className="press flex-1 rounded-xl border hairline py-2.5 text-sm font-semibold disabled:opacity-50">
          ⬇ Backup JSON
        </button>
        <button onClick={exportCsv} disabled={busy}
          className="press flex-1 rounded-xl border hairline py-2.5 text-sm font-semibold disabled:opacity-50">
          ⬇ Brews CSV
        </button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)}
          className="h-4 w-4 accent-danger" />
        <span>
          Reemplazar: <span className="text-ink/60">borrar todos mis datos antes de importar</span>
        </span>
      </label>
      <label className={`press mt-2 flex items-center justify-center rounded-xl border py-2.5 text-sm font-semibold ${replace ? 'border-danger/50 text-danger' : 'hairline'} ${busy ? 'opacity-50' : ''}`}>
        ⬆ Importar backup JSON{replace ? ' (reemplazando)' : ''}
        <input type="file" accept="application/json" className="hidden" disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importJson(f)
            e.target.value = ''
          }} />
      </label>
      {message && <p className="mt-2 text-xs text-ink/70">{message}</p>}
      <p className="mt-2 text-[11px] text-ink/45">
        El backup incluye todos tus datos salvo las fotos. Importar añade (no reemplaza) con ids nuevos.
      </p>
    </div>
  )
}
