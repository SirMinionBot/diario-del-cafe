import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { METHODS, METHOD_LIST, type MethodId } from '../lib/methods.ts'
import { formatRatio, waterForCoffee } from '../lib/ratio.ts'
import { shareRecipeCard } from '../lib/shareCard.ts'
import { daysSinceRoast, freshnessState, FRESHNESS_LABEL } from '../lib/freshness.ts'
import { aggregateTastings, parseTasting, type TastingProfile } from '../lib/tasting.ts'
import type { Coffee, CoffeeBag, Recipe } from '../types.ts'

const input = 'card mt-1 w-full px-3 py-2.5 text-base'
const label = 'text-xs text-ink/60'

type CoffeeForm = {
  name: string
  roaster: string
  origin: string
  roast_level: '' | 'claro' | 'medio' | 'oscuro'
  price_per_kg: string
  notes: string
}

const emptyForm: CoffeeForm = {
  name: '',
  roaster: '',
  origin: '',
  roast_level: '',
  price_per_kg: '',
  notes: '',
}

function toForm(c: Coffee): CoffeeForm {
  return {
    name: c.name,
    roaster: c.roaster ?? '',
    origin: c.origin ?? '',
    roast_level: c.roast_level ?? '',
    price_per_kg: c.price_per_kg?.toString() ?? '',
    notes: c.notes ?? '',
  }
}

function fromForm(f: CoffeeForm) {
  return {
    name: f.name.trim(),
    roaster: f.roaster.trim() || null,
    origin: f.origin.trim() || null,
    roast_level: f.roast_level || null,
    price_per_kg: f.price_per_kg ? Number(f.price_per_kg) : null,
    notes: f.notes.trim() || null,
  }
}

export default function CafeDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuevo'

  const [form, setForm] = useState<CoffeeForm>(emptyForm)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [bags, setBags] = useState<CoffeeBag[]>([])
  const [profile, setProfile] = useState<TastingProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (isNew || !id) return
    let cancelled = false
    void Promise.all([
      supabase.from('coffees').select('*').eq('id', id).single(),
      supabase.from('recipes').select('*').eq('coffee_id', id),
      supabase.from('coffee_bags').select('*').eq('coffee_id', id).order('roast_date', { ascending: false }),
      supabase.from('brews').select('tasting').eq('coffee_id', id).not('tasting', 'is', null),
    ]).then(([c, r, b, t]) => {
      if (cancelled) return
      if (c.data) setForm(toForm(c.data as Coffee))
      setRecipes((r.data as Recipe[] | null) ?? [])
      setBags((b.data as CoffeeBag[] | null) ?? [])
      // perfil sensorial: solo catas que pasan el validador (spec tasting-notes)
      const tastings = ((t.data as { tasting: unknown }[] | null) ?? [])
        .map((row) => parseTasting(row.tasting))
        .filter((x) => x !== null)
      setProfile(aggregateTastings(tastings))
    })
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  async function saveCoffee(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (isNew) {
      const { data } = await supabase.from('coffees').insert(fromForm(form)).select('id').single()
      if (data) navigate(`/cafes/${data.id}`, { replace: true })
    } else {
      await supabase.from('coffees').update(fromForm(form)).eq('id', id!)
      navigate('/cafes')
    }
    setSaving(false)
  }

  async function archiveCoffee() {
    await supabase.from('coffees').update({ archived_at: new Date().toISOString() }).eq('id', id!)
    navigate('/cafes')
  }

  return (
    <section>
      <Link to="/cafes" className="text-sm text-copper">← Cafés</Link>
      <h1 className="mt-1 text-3xl">{isNew ? 'Nuevo café' : form.name || 'Café'}</h1>

      {/* ─── ficha del café ─── */}
      <form onSubmit={saveCoffee} className="card mt-4 flex flex-col gap-3 p-4">
        <label>
          <span className={label}>Nombre *</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={input}
            placeholder="Etiopía Yirgacheffe"
          />
        </label>
        <div className="flex gap-3">
          <label className="flex-1">
            <span className={label}>Tostador / marca</span>
            <input
              value={form.roaster}
              onChange={(e) => setForm({ ...form, roaster: e.target.value })}
              className={input}
            />
          </label>
          <label className="flex-1">
            <span className={label}>Origen</span>
            <input
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className={input}
            />
          </label>
        </div>
        <div className="flex gap-3">
          <label className="flex-1">
            <span className={label}>Tueste</span>
            <select
              value={form.roast_level}
              onChange={(e) => setForm({ ...form, roast_level: e.target.value as CoffeeForm['roast_level'] })}
              className={input}
            >
              <option value="">—</option>
              <option value="claro">Claro</option>
              <option value="medio">Medio</option>
              <option value="oscuro">Oscuro</option>
            </select>
          </label>
          <label className="flex-1">
            <span className={label}>Precio €/kg</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.price_per_kg}
              onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
              className={input}
              data-numeric
            />
          </label>
        </div>
        <label>
          <span className={label}>Notas</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={input}
            rows={2}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="press rounded-xl bg-caramel py-3 font-semibold text-white disabled:opacity-60"
        >
          {isNew ? 'Crear café' : 'Guardar cambios'}
        </button>
      </form>

      {!isNew && (
        <>
          {profile && (
            <div className="card mt-4 p-4">
              <p className="uppercase text-xs text-copper">
                perfil sensorial · {profile.catas} cata{profile.catas === 1 ? '' : 's'}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
                {Object.entries(profile.ejes).map(([axis, value]) => (
                  <div key={axis} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{axis}</span>
                    <span className="font-semibold" data-numeric>{value}</span>
                  </div>
                ))}
              </div>
              {profile.topDescriptores.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.topDescriptores.map((d) => (
                    <span key={d} className="rounded-full bg-crema/70 px-2.5 py-1 text-xs text-ink/70">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <RecipesSection coffeeId={id!} coffeeName={form.name} recipes={recipes} onChange={setRecipes} />
          <BagsSection coffeeId={id!} bags={bags} onChange={setBags} today={today} />

          <button
            onClick={archiveCoffee}
            className="press mt-6 w-full rounded-xl border hairline py-2.5 text-sm font-semibold text-danger"
          >
            Archivar café (conserva su historial)
          </button>
        </>
      )}
    </section>
  )
}

// ─── recetas por método (sobrescriben los defaults; spec coffee-catalog) ──────

function RecipesSection({
  coffeeId,
  coffeeName,
  recipes,
  onChange,
}: {
  coffeeId: string
  coffeeName: string
  recipes: Recipe[]
  onChange: (r: Recipe[]) => void
}) {
  const [editing, setEditing] = useState<MethodId | null>(null)
  const [draft, setDraft] = useState({ ratio: '', dose_g: '', grind_setting: '', water_temp_c: '', target_time_s: '' })

  function startEdit(methodId: MethodId) {
    const existing = recipes.find((r) => r.method === methodId)
    const m = METHODS[methodId]
    setDraft({
      ratio: (existing?.ratio ?? m.ratio).toString(),
      dose_g: (existing?.dose_g ?? m.defaultDoseG).toString(),
      grind_setting: existing?.grind_setting ?? '',
      water_temp_c: (existing?.water_temp_c ?? m.waterTempC).toString(),
      target_time_s: existing?.target_time_s?.toString() ?? '',
    })
    setEditing(methodId)
  }

  async function saveRecipe(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    const row = {
      coffee_id: coffeeId,
      method: editing,
      ratio: Number(draft.ratio),
      dose_g: Number(draft.dose_g),
      grind_setting: draft.grind_setting.trim() || null,
      water_temp_c: draft.water_temp_c ? Number(draft.water_temp_c) : null,
      target_time_s: draft.target_time_s ? Number(draft.target_time_s) : null,
      updated_at: new Date().toISOString(),
    }
    const existing = recipes.find((r) => r.method === editing)
    if (existing) {
      const { data } = await supabase.from('recipes').update(row).eq('id', existing.id).select().single()
      if (data) onChange(recipes.map((r) => (r.id === existing.id ? (data as Recipe) : r)))
    } else {
      const { data } = await supabase.from('recipes').insert(row).select().single()
      if (data) onChange([...recipes, data as Recipe])
    }
    setEditing(null)
  }

  async function deleteRecipe(recipeId: string) {
    await supabase.from('recipes').delete().eq('id', recipeId)
    onChange(recipes.filter((r) => r.id !== recipeId))
    setEditing(null)
  }

  return (
    <div className="card mt-4 p-4">
      <p className="uppercase text-xs text-copper">recetas propias</p>
      <ul className="mt-2 flex flex-col">
        {METHOD_LIST.map((m) => {
          const recipe = recipes.find((r) => r.method === m.id)
          return (
            <li key={m.id} className="border-b hairline py-2 last:border-b-0">
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(m.id)} className="press flex w-full items-center justify-between">
                  <span className="font-medium">{m.name}</span>
                  {recipe ? (
                    <span className="text-sm font-semibold text-leaf" data-numeric>
                      {formatRatio(recipe.ratio)} · {recipe.dose_g} g
                    </span>
                  ) : (
                    <span className="text-sm text-ink/40" data-numeric>
                      defaults {formatRatio(m.ratio)}
                    </span>
                  )}
                </button>
                {recipe && (
                  <button
                    onClick={() =>
                      shareRecipeCard({
                        coffeeName,
                        methodName: m.name,
                        ratio: recipe.ratio,
                        doseG: recipe.dose_g,
                        waterG: waterForCoffee(recipe.dose_g, recipe.ratio),
                        grind: recipe.grind_setting,
                        tempC: recipe.water_temp_c,
                        targetTimeS: recipe.target_time_s,
                      })
                    }
                    className="press shrink-0 text-lg"
                    aria-label={`Compartir receta de ${m.name}`}
                  >
                    📤
                  </button>
                )}
              </div>

              {editing === m.id && (
                <form onSubmit={saveRecipe} className="mt-2 rounded-lg bg-crema/40 p-3">
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <span className={label}>Ratio (1:N)</span>
                      <input type="number" inputMode="decimal" step="0.1" min="0.5" required value={draft.ratio}
                        onChange={(e) => setDraft({ ...draft, ratio: e.target.value })} className={input} data-numeric />
                    </label>
                    <label className="flex-1">
                      <span className={label}>Dosis (g)</span>
                      <input type="number" inputMode="decimal" step="0.1" min="1" required value={draft.dose_g}
                        onChange={(e) => setDraft({ ...draft, dose_g: e.target.value })} className={input} data-numeric />
                    </label>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <label className="flex-1">
                      <span className={label}>Molienda</span>
                      <input value={draft.grind_setting} placeholder="p. ej. 12 clics"
                        onChange={(e) => setDraft({ ...draft, grind_setting: e.target.value })} className={input} />
                    </label>
                    <label className="w-20">
                      <span className={label}>°C</span>
                      <input type="number" inputMode="numeric" min="1" max="100" value={draft.water_temp_c}
                        onChange={(e) => setDraft({ ...draft, water_temp_c: e.target.value })} className={input} data-numeric />
                    </label>
                    <label className="w-20">
                      <span className={label}>Obj. (s)</span>
                      <input type="number" inputMode="numeric" min="1" value={draft.target_time_s}
                        onChange={(e) => setDraft({ ...draft, target_time_s: e.target.value })} className={input} data-numeric />
                    </label>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="submit" className="press flex-1 rounded-lg bg-caramel py-2 text-sm font-semibold text-white">
                      Guardar receta
                    </button>
                    {recipe && (
                      <button type="button" onClick={() => deleteRecipe(recipe.id)}
                        className="press rounded-lg border hairline px-3 text-sm font-semibold text-danger">
                        Borrar
                      </button>
                    )}
                    <button type="button" onClick={() => setEditing(null)}
                      className="press rounded-lg border hairline px-3 text-sm">
                      ✕
                    </button>
                  </div>
                </form>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── paquetes y frescura (spec coffee-inventory) ──────────────────────────────

const FRESHNESS_COLOR = {
  reposo: 'text-warn',
  optimo: 'text-leaf',
  pasado: 'text-danger',
} as const

function BagsSection({
  coffeeId,
  bags,
  onChange,
  today,
}: {
  coffeeId: string
  bags: CoffeeBag[]
  onChange: (b: CoffeeBag[]) => void
  today: string
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ roast_date: '', weight_g: '250' })
  const active = bags.filter((b) => !b.finished_at)
  const finished = bags.length - active.length

  async function addBag(e: FormEvent) {
    e.preventDefault()
    const { data } = await supabase
      .from('coffee_bags')
      .insert({ coffee_id: coffeeId, roast_date: draft.roast_date, weight_g: Number(draft.weight_g) })
      .select()
      .single()
    if (data) onChange([data as CoffeeBag, ...bags])
    setAdding(false)
  }

  async function update(bagId: string, patch: Partial<CoffeeBag>) {
    const { data } = await supabase.from('coffee_bags').update(patch).eq('id', bagId).select().single()
    if (data) onChange(bags.map((b) => (b.id === bagId ? (data as CoffeeBag) : b)))
  }

  return (
    <div className="card mt-4 p-4">
      <div className="flex items-center justify-between">
        <p className="uppercase text-xs text-copper">paquetes</p>
        <button onClick={() => setAdding(!adding)} className="press text-sm font-semibold text-caramel">
          {adding ? '✕' : '+ Añadir'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addBag} className="mt-2 flex items-end gap-2 rounded-lg bg-crema/40 p-3">
          <label className="flex-1">
            <span className={label}>Fecha de tueste</span>
            <input type="date" required max={today} value={draft.roast_date}
              onChange={(e) => setDraft({ ...draft, roast_date: e.target.value })} className={input} />
          </label>
          <label className="w-24">
            <span className={label}>Peso (g)</span>
            <input type="number" inputMode="numeric" min="1" required value={draft.weight_g}
              onChange={(e) => setDraft({ ...draft, weight_g: e.target.value })} className={input} data-numeric />
          </label>
          <button type="submit" className="press rounded-lg bg-caramel px-4 py-2.5 text-sm font-semibold text-white">
            ✓
          </button>
        </form>
      )}

      {active.length === 0 && !adding && (
        <p className="mt-2 text-sm text-ink/60">Sin paquetes activos.</p>
      )}

      <ul className="mt-2 flex flex-col">
        {active.map((bag) => {
          const days = daysSinceRoast(bag.roast_date, today)
          const state = freshnessState(days, 'filtro')
          return (
            <li key={bag.id} className="flex items-center justify-between border-b hairline py-2 last:border-b-0">
              <div>
                <p className="text-sm font-medium" data-numeric>
                  {bag.weight_g} g · tueste {bag.roast_date}
                </p>
                <p className={`text-xs font-semibold ${FRESHNESS_COLOR[state]}`}>
                  {FRESHNESS_LABEL[state]} · día {days}
                </p>
              </div>
              <div className="flex gap-1.5">
                {!bag.opened_at && (
                  <button onClick={() => update(bag.id, { opened_at: today })}
                    className="press rounded-lg border hairline px-2.5 py-1.5 text-xs font-semibold">
                    Abrir
                  </button>
                )}
                <button onClick={() => update(bag.id, { finished_at: today })}
                  className="press rounded-lg border hairline px-2.5 py-1.5 text-xs font-semibold text-ink/60">
                  Terminar
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {finished > 0 && (
        <p className="mt-2 text-xs text-ink/50" data-numeric>
          {finished} paquete{finished === 1 ? '' : 's'} terminado{finished === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}
