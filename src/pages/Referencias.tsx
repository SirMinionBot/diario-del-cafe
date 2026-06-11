import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCoffeeData } from '../hooks/useCoffeeData.ts'
import { supabase } from '../lib/supabase.ts'
import { METHODS } from '../lib/methods.ts'
import { formatRatio } from '../lib/ratio.ts'
import { formatTime } from '../lib/timer.ts'
import { REFERENCE_RECIPES, type ReferenceRecipe } from '../lib/referenceRecipes.ts'

export default function Referencias() {
  const navigate = useNavigate()
  const { coffees, recipes, refresh } = useCoffeeData()
  const [savingFor, setSavingFor] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  /** fork: guarda la referencia como receta propia del café elegido (spec reference-recipes) */
  async function saveFor(ref: ReferenceRecipe, coffeeId: string) {
    const row = {
      coffee_id: coffeeId,
      method: ref.methodId,
      ratio: ref.ratio,
      dose_g: ref.doseG,
      water_temp_c: ref.waterTempC,
      target_time_s: ref.targetTimeS ?? null,
      notes: `Basada en «${ref.name}» (${ref.author})`,
      updated_at: new Date().toISOString(),
    }
    const existing = recipes.find((r) => r.coffee_id === coffeeId && r.method === ref.methodId)
    if (existing) await supabase.from('recipes').update(row).eq('id', existing.id)
    else await supabase.from('recipes').insert(row)
    await refresh()
    setSavingFor(null)
    setSaved(ref.id)
  }

  return (
    <section>
      <Link to="/" className="text-sm text-copper">← Preparar</Link>
      <p className="uppercase mt-2 text-xs text-copper">catálogo de solo lectura</p>
      <h1 className="mt-1 text-3xl">Recetas de referencia</h1>

      <ul className="mt-4 flex flex-col gap-3">
        {REFERENCE_RECIPES.map((ref) => (
          <li key={ref.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl">{ref.name}</h2>
              <span className="shrink-0 text-xs text-ink/50">{METHODS[ref.methodId].name}</span>
            </div>
            <p className="mt-0.5 text-sm text-ink/60">{ref.author}</p>
            <p className="mt-1.5 text-sm" data-numeric>
              {formatRatio(ref.ratio)} · {ref.doseG} g · {ref.waterTempC} °C
              {ref.targetTimeS && <> · {formatTime(ref.targetTimeS)}</>}
            </p>
            <p className="mt-1 text-xs text-ink/45">{ref.source}</p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate('/', { state: { reference: ref.id } })}
                className="press flex-1 rounded-xl bg-caramel py-2 text-sm font-semibold text-white"
              >
                Usar
              </button>
              <button
                onClick={() => setSavingFor(savingFor === ref.id ? null : ref.id)}
                className="press flex-1 rounded-xl border hairline py-2 text-sm font-semibold"
              >
                {saved === ref.id ? '✓ Guardada' : 'Guardar para…'}
              </button>
            </div>

            {savingFor === ref.id && (
              <div className="mt-2">
                {coffees.length === 0 ? (
                  <p className="text-xs text-warn">Primero crea un café en la pestaña Cafés.</p>
                ) : (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && void saveFor(ref, e.target.value)}
                    className="card w-full px-3 py-2.5 text-sm"
                  >
                    <option value="" disabled>— Elige el café —</option>
                    {coffees.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
