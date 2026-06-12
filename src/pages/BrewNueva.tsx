import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useCoffeeData } from '../hooks/useCoffeeData.ts'
import { useOfflineSync } from '../hooks/useOfflineSync.ts'
import { openBrewQueue } from '../lib/offlineQueue.ts'
import { METHODS, METHOD_LIST, type MethodId } from '../lib/methods.ts'
import { dialIn, type DialInSuggestion, type TasteLabel } from '../lib/dialin.ts'
import { ratioFor } from '../lib/ratio.ts'
import { compressPhoto } from '../lib/photo.ts'
import CoffeeSelect from '../components/CoffeeSelect.tsx'
import { FLAVOR_WHEEL, TASTING_AXES, parseTasting, type TastingAxis } from '../lib/tasting.ts'
import { daysSinceRoast, freshnessState } from '../lib/freshness.ts'
import type { CoffeeBag } from '../types.ts'

/** Paquete abierto más fresco en ventana óptima del café (delta coffee-inventory). */
function preselectBag(bags: CoffeeBag[], coffeeId: string, today: string): string {
  const candidates = bags
    .filter((b) => b.coffee_id === coffeeId && b.opened_at !== null)
    .filter((b) => freshnessState(daysSinceRoast(b.roast_date, today), 'filtro') === 'optimo')
    .sort((a, b) => b.roast_date.localeCompare(a.roast_date))
  return candidates[0]?.id ?? ''
}

const input = 'card mt-1 w-full px-3 py-2.5 text-base'
const label = 'text-xs text-ink/60'

/** estado precargado desde el cronómetro (y desde «repetir último», spec quick-repeat) */
type PrefillState = {
  method?: MethodId
  coffeeId?: string | null
  recipeId?: string | null
  doseG?: number
  waterG?: number
  timeS?: number
  bagId?: string | null
  grind?: string | null
  grinderId?: string | null
  grindValue?: number | null
}

const TASTE_OPTIONS: { value: TasteLabel; label: string }[] = [
  { value: 'acido', label: 'Ácido / agrio' },
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'amargo', label: 'Amargo / astringente' },
]

const AXIS_LABEL: Record<TastingAxis, string> = {
  acidez: 'Acidez',
  cuerpo: 'Cuerpo',
  dulzor: 'Dulzor',
  amargor: 'Amargor',
}

export default function BrewNueva() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { notifyQueued } = useOfflineSync()
  const prefill = (useLocation().state ?? {}) as PrefillState
  const { coffees, recipes, bags, grinders } = useCoffeeData()
  const today = new Date().toISOString().slice(0, 10)

  const [methodId, setMethodId] = useState<MethodId>(prefill.method ?? 'espresso')
  const [coffeeId, setCoffeeId] = useState(prefill.coffeeId ?? '')
  const [bagId, setBagId] = useState(prefill.bagId ?? '')
  const [grinderId, setGrinderId] = useState(prefill.grinderId ?? '')
  const [grindValue, setGrindValue] = useState(prefill.grindValue?.toString() ?? '')

  function selectCoffee(id: string) {
    setCoffeeId(id)
    setBagId(id ? preselectBag(bags, id, today) : '')
  }
  const [doseG, setDoseG] = useState(prefill.doseG?.toString() ?? '')
  const [waterG, setWaterG] = useState(prefill.waterG?.toString() ?? '')
  const [timeS, setTimeS] = useState(prefill.timeS?.toString() ?? '')
  const [grind, setGrind] = useState(prefill.grind ?? '')
  const [rating, setRating] = useState(0)
  const [taste, setTaste] = useState<TasteLabel | null>(null)
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  // cata opcional (spec tasting-notes)
  const [showTasting, setShowTasting] = useState(false)
  const [axes, setAxes] = useState<Record<TastingAxis, number>>({ acidez: 3, cuerpo: 3, dulzor: 3, amargor: 3 })
  const [descriptors, setDescriptors] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<DialInSuggestion | null>(null)
  const [recipeSaved, setRecipeSaved] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const tasting = showTasting ? parseTasting({ ...axes, descriptores: descriptors }) : null
    const payload = {
      coffee_id: coffeeId,
      bag_id: bagId || null,
      recipe_id: prefill.recipeId ?? null,
      method: methodId,
      dose_g: Number(doseG),
      water_g: waterG ? Number(waterG) : null,
      // molienda: UN dato en dos modos — molinillo+ajuste O texto libre, nunca ambos
      grind_setting: grinderId ? null : grind.trim() || null,
      grinder_id: grinderId || null,
      grind_value: grinderId && grindValue !== '' ? Number(grindValue) : null,
      time_s: timeS ? Number(timeS) : null,
      rating: rating || null,
      taste_label: taste,
      tasting,
      notes: notes.trim() || null,
    }
    try {
      // foto: comprimir en cliente y subir al bucket privado del usuario
      let photoPath: string | null = null
      if (photo && session) {
        const blob = await compressPhoto(photo)
        photoPath = `${session.user.id}/${crypto.randomUUID()}.jpg`
        const { error: upErr } = await supabase.storage.from('brew-photos').upload(photoPath, blob, {
          contentType: 'image/jpeg',
        })
        if (upErr) throw upErr
      }

      const { error: insErr } = await supabase.from('brews').insert({ ...payload, photo_path: photoPath })
      if (insErr) throw insErr

      // dial-in tras guardar (spec dial-in-assistant): necesita tiempo + sabor
      if (taste && timeS) {
        setSuggestion(dialIn({ method: METHODS[methodId], timeS: Number(timeS), taste }))
      } else {
        navigate('/diario')
      }
    } catch {
      // sin red: encolar con UUID de cliente (spec offline-sync); la foto no
      // puede subirse offline y se omite
      const queue = navigator.onLine ? null : await openBrewQueue()
      if (queue) {
        await queue.add({
          id: crypto.randomUUID(),
          payload,
          queuedAt: new Date().toISOString(),
        })
        notifyQueued()
        navigate('/diario', { state: { queued: true, photoSkipped: photo !== null } })
      } else {
        // sin IndexedDB o fallo no-red: aviso claro y el formulario conserva su estado
        setError('No se pudo guardar. ¿Sin conexión? Tus datos siguen en el formulario.')
      }
    } finally {
      setSaving(false)
    }
  }

  /** guarda los parámetros del shot equilibrado como receta del café (upsert por café+método) */
  async function saveAsRecipe() {
    const ratio = ratioFor(Number(doseG), Number(waterG))
    if (!coffeeId || !ratio) return
    const existing = recipes.find((r) => r.coffee_id === coffeeId && r.method === methodId)
    const row = {
      coffee_id: coffeeId,
      method: methodId,
      ratio,
      dose_g: Number(doseG),
      grind_setting: grinderId ? null : grind.trim() || null,
      target_time_s: timeS ? Number(timeS) : null,
      updated_at: new Date().toISOString(),
    }
    if (existing) await supabase.from('recipes').update(row).eq('id', existing.id)
    else await supabase.from('recipes').insert(row)
    setRecipeSaved(true)
  }

  // ─── vista de sugerencia dial-in tras guardar ───
  if (suggestion) {
    return (
      <section className="flex flex-col gap-4">
        <p className="uppercase text-xs text-copper">asistente dial-in</p>
        <h1 className="text-3xl">{suggestion.title}</h1>
        <div className="card p-4 text-sm leading-relaxed text-ink/80">{suggestion.reason}</div>
        <p className="text-xs text-ink/50">
          Orientativo: ajusta una sola variable y vuelve a probar.
        </p>
        {suggestion.offerSaveRecipe && coffeeId && (
          <button
            onClick={saveAsRecipe}
            disabled={recipeSaved}
            className="press rounded-xl bg-leaf py-3 font-semibold text-white disabled:opacity-60"
          >
            {recipeSaved ? '✓ Guardada como receta' : 'Guardar estos parámetros como receta'}
          </button>
        )}
        <button
          onClick={() => navigate('/diario')}
          className="press rounded-xl border hairline py-3 font-semibold"
        >
          Ir al diario
        </button>
      </section>
    )
  }

  return (
    <section>
      <Link to="/diario" className="text-sm text-copper">← Diario</Link>
      <h1 className="mt-1 text-3xl">Nueva extracción</h1>

      <form onSubmit={save} className="mt-4 flex flex-col gap-3">
        <label>
          <span className={label}>Café *</span>
          <CoffeeSelect
            coffees={coffees}
            value={coffeeId}
            onChange={selectCoffee}
            emptyLabel="— Elige un café —"
            required
            className={input}
          />
        </label>

        {coffeeId && bags.some((b) => b.coffee_id === coffeeId) && (
          <label>
            <span className={label}>Paquete</span>
            <select value={bagId} onChange={(e) => setBagId(e.target.value)} className={input}>
              <option value="">— Sin paquete —</option>
              {bags
                .filter((b) => b.coffee_id === coffeeId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    Tueste {b.roast_date} · {b.weight_g} g{b.opened_at ? ' · abierto' : ''}
                  </option>
                ))}
            </select>
          </label>
        )}
        {coffees.length === 0 && (
          <p className="text-xs text-warn">
            Primero crea un café en la pestaña Cafés.
          </p>
        )}

        <div className="flex gap-3">
          <label className="flex-1">
            <span className={label}>Método *</span>
            <select required value={methodId} onChange={(e) => setMethodId(e.target.value as MethodId)} className={input}>
              {METHOD_LIST.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="w-24">
            <span className={label}>Dosis (g) *</span>
            <input type="number" inputMode="decimal" step="0.1" min="0.1" required value={doseG}
              onChange={(e) => setDoseG(e.target.value)} className={input} data-numeric />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex-1">
            <span className={label}>{METHODS[methodId].family === 'espresso' ? 'En taza (g)' : 'Agua (g)'}</span>
            <input type="number" inputMode="decimal" step="1" min="0" value={waterG}
              onChange={(e) => setWaterG(e.target.value)} className={input} data-numeric />
          </label>
          <label className="w-24">
            <span className={label}>Tiempo (s)</span>
            <input type="number" inputMode="numeric" min="1" value={timeS}
              onChange={(e) => setTimeS(e.target.value)} className={input} data-numeric />
          </label>
        </div>

        {/* molienda: un solo campo lógico — con molinillo el ajuste es numérico,
            sin él texto libre. Nunca se piden los dos a la vez. */}
        <div className="flex gap-3">
          {grinders.length > 0 && (
            <label className="flex-1">
              <span className={label}>Molinillo</span>
              <select value={grinderId} onChange={(e) => setGrinderId(e.target.value)} className={input}>
                <option value="">— texto libre</option>
                {grinders.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
          )}
          {grinderId ? (
            <label className="w-24">
              <span className={label}>Ajuste</span>
              <input type="number" inputMode="decimal" step="0.5" value={grindValue}
                onChange={(e) => setGrindValue(e.target.value)} className={input} data-numeric />
            </label>
          ) : (
            <label className="flex-1">
              <span className={label}>Molienda</span>
              <input value={grind} placeholder="12 clics / media-fina" onChange={(e) => setGrind(e.target.value)} className={input} />
            </label>
          )}
        </div>

        {/* valoración 1–5 */}
        <div>
          <span className={label}>Valoración</span>
          <div className="mt-1 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)}
                className={`press text-2xl ${n <= rating ? '' : 'opacity-25 grayscale'}`} aria-label={`${n} estrellas`}>
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* etiqueta de sabor: alimenta el dial-in */}
        <div>
          <span className={label}>¿Cómo sabe?</span>
          <div className="mt-1 flex gap-2">
            {TASTE_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => setTaste(taste === o.value ? null : o.value)}
                className={`press flex-1 rounded-full px-2 py-2 text-xs font-semibold ${
                  taste === o.value ? 'bg-ink text-paper' : 'card text-ink/70'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* cata sensorial opcional */}
        <div className="card p-3">
          <button type="button" onClick={() => setShowTasting(!showTasting)}
            className="press flex w-full items-center justify-between text-sm font-semibold">
            <span className="uppercase text-xs text-copper">cata sensorial</span>
            <span>{showTasting ? '−' : '+'}</span>
          </button>
          {showTasting && (
            <div className="mt-3 flex flex-col gap-3">
              {TASTING_AXES.map((axis) => (
                <div key={axis} className="flex items-center justify-between">
                  <span className="w-20 text-sm">{AXIS_LABEL[axis]}</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setAxes({ ...axes, [axis]: n })}
                        className={`press h-7 w-7 rounded-full text-xs font-bold ${
                          axes[axis] === n ? 'bg-copper text-white' : 'bg-crema/60 text-ink/50'
                        }`} data-numeric>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {Object.entries(FLAVOR_WHEEL).map(([family, list]) => (
                <div key={family}>
                  <p className="text-xs font-semibold capitalize text-ink/50">{family}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {list.map((d) => (
                      <button key={d} type="button"
                        onClick={() => setDescriptors(descriptors.includes(d)
                          ? descriptors.filter((x) => x !== d)
                          : [...descriptors, d])}
                        className={`press rounded-full px-2.5 py-1 text-xs ${
                          descriptors.includes(d) ? 'bg-caramel text-white' : 'bg-crema/60 text-ink/70'
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <label>
          <span className={label}>Notas</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={input} rows={2} />
        </label>

        <label>
          <span className={label}>Foto (opcional)</span>
          <input type="file" accept="image/*" capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm" />
        </label>

        {error && <p className="text-sm font-semibold text-danger">{error}</p>}

        <button type="submit" disabled={saving || !coffeeId}
          className="press rounded-xl bg-caramel py-3 text-lg font-semibold text-white disabled:opacity-60">
          {saving ? 'Guardando…' : 'Guardar extracción'}
        </button>
      </form>
    </section>
  )
}
