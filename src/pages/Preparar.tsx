import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import BrewTimer from '../components/BrewTimer.tsx'
import CoffeeSelect from '../components/CoffeeSelect.tsx'
import { useCoffeeData } from '../hooks/useCoffeeData.ts'
import { formatGrind } from '../lib/grinders.ts'
import { supabase } from '../lib/supabase.ts'
import { METHODS, METHOD_LIST, type MethodId } from '../lib/methods.ts'
import { coffeeForWater, formatRatio, ratioFor, waterForCoffee } from '../lib/ratio.ts'
import { referenceById } from '../lib/referenceRecipes.ts'
import { daysSinceRoast, freshnessState } from '../lib/freshness.ts'
import type { Brew, CoffeeBag } from '../types.ts'

type LastBrew = Pick<
  Brew,
  'coffee_id' | 'bag_id' | 'method' | 'dose_g' | 'water_g' | 'grind_setting' | 'grinder_id' | 'grind_value'
>

/** extras del último brew que no viven en Preparar pero viajan al registro */
type RepeatExtras = Pick<LastBrew, 'bag_id' | 'grind_setting' | 'grinder_id' | 'grind_value'>

/** Paquete abierto más fresco en ventana óptima (mismo criterio que BrewNueva). */
function activeBagFor(bags: CoffeeBag[], coffeeId: string, today: string): string | null {
  const candidates = bags
    .filter((b) => b.coffee_id === coffeeId && b.opened_at !== null)
    .filter((b) => freshnessState(daysSinceRoast(b.roast_date, today), 'filtro') === 'optimo')
    .sort((a, b) => b.roast_date.localeCompare(a.roast_date))
  return candidates[0]?.id ?? null
}

export default function Preparar() {
  const navigate = useNavigate()
  const { coffees, recipes, bags } = useCoffeeData()
  const today = new Date().toISOString().slice(0, 10)
  // «Usar» una receta de referencia precarga método, ratio, dosis y fases (spec reference-recipes)
  const refState = (useLocation().state as { reference?: string } | null)?.reference
  const reference = refState ? referenceById(refState) : null
  // shortcut PWA «Repetir último» (spec quick-repeat); se consume UNA vez
  const [searchParams] = useSearchParams()
  const autoRepeat = useRef(searchParams.get('repetir') === '1')

  const [methodId, setMethodId] = useState<MethodId>(reference?.methodId ?? 'espresso')
  const [coffeeId, setCoffeeId] = useState<string>('')
  // overrides puntuales del usuario; null = usar receta/defaults (spec ratio-calculator)
  const [ratioOverride, setRatioOverride] = useState<number | null>(reference?.ratio ?? null)
  const [doseOverride, setDoseOverride] = useState<number | null>(reference?.doseG ?? null)

  // ─── repetir última extracción (spec quick-repeat) ───
  const [lastBrew, setLastBrew] = useState<LastBrew | null>(null)
  const [repeatExtras, setRepeatExtras] = useState<RepeatExtras | null>(null)
  const [repeatMsg, setRepeatMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void supabase
      .from('brews')
      .select('coffee_id, bag_id, method, dose_g, water_g, grind_setting, grinder_id, grind_value')
      .order('brewed_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) setLastBrew((data?.[0] as LastBrew | undefined) ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function applyRepeat(brew: LastBrew) {
    const coffee = coffees.find((c) => c.id === brew.coffee_id)
    if (!coffee) {
      setRepeatMsg('No se pudo repetir: el café de la última extracción ya no está en tu catálogo.')
      return
    }
    setMethodId(brew.method)
    setCoffeeId(brew.coffee_id)
    setDoseOverride(brew.dose_g)
    setRatioOverride(brew.water_g ? ratioFor(brew.dose_g, brew.water_g) : null)
    const bagAlive = brew.bag_id !== null && bags.some((b) => b.id === brew.bag_id)
    setRepeatExtras({
      bag_id: bagAlive ? brew.bag_id : null,
      grind_setting: brew.grind_setting,
      grinder_id: brew.grinder_id,
      grind_value: brew.grind_value,
    })
    setRepeatMsg(
      `↻ Precargado: ${coffee.name} · ${brew.dose_g} g${formatGrind(brew.grind_setting, brew.grind_value) ? ` · ${formatGrind(brew.grind_setting, brew.grind_value)}` : ''}` +
        (brew.bag_id && !bagAlive ? ' (paquete ya terminado, omitido)' : ''),
    )
  }

  // shortcut: aplicar una sola vez cuando los datos están listos
  useEffect(() => {
    if (!autoRepeat.current || !lastBrew || coffees.length === 0) return
    autoRepeat.current = false
    void Promise.resolve().then(() => applyRepeat(lastBrew))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- aplicar solo al estar listos
  }, [lastBrew, coffees])

  const baseMethod = METHODS[methodId]
  // la referencia activa puede aportar sus propias fases al cronómetro
  const method = useMemo(
    () =>
      reference && reference.methodId === methodId && reference.phases
        ? { ...baseMethod, phases: reference.phases }
        : baseMethod,
    [reference, methodId, baseMethod],
  )
  const recipe = useMemo(
    () => recipes.find((r) => r.coffee_id === coffeeId && r.method === methodId) ?? null,
    [recipes, coffeeId, methodId],
  )

  const ratio = ratioOverride ?? recipe?.ratio ?? method.ratio
  const doseG = doseOverride ?? recipe?.dose_g ?? method.defaultDoseG
  const waterG = waterForCoffee(doseG, ratio)
  const tempC = recipe?.water_temp_c ?? method.waterTempC

  function selectMethod(id: MethodId) {
    setMethodId(id)
    setRatioOverride(null)
    setDoseOverride(null)
  }

  function selectCoffee(id: string) {
    setCoffeeId(id)
    setRatioOverride(null)
    setDoseOverride(null)
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="uppercase text-xs text-copper">diario del café</p>
        <h1 className="mt-1 text-3xl">Preparar</h1>
      </div>

      {reference && (
        <div className="card border-leaf/40 bg-crema/40 p-3 text-sm">
          📖 Usando <strong>{reference.name}</strong> ({reference.author})
        </div>
      )}

      {/* repetir el caso más frecuente con un toque (spec quick-repeat) */}
      {lastBrew && !repeatMsg && (
        <button
          onClick={() => applyRepeat(lastBrew)}
          className="card press p-3 text-left text-sm font-semibold text-copper"
        >
          ↻ Repetir último: {coffees.find((c) => c.id === lastBrew.coffee_id)?.name ?? 'café archivado'} ·{' '}
          <span data-numeric>{lastBrew.dose_g} g</span>
        </button>
      )}
      {repeatMsg && (
        <div className="card border-copper/40 bg-crema/40 p-3 text-sm">{repeatMsg}</div>
      )}

      {/* selector de método */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {METHOD_LIST.map((m) => (
          <button
            key={m.id}
            onClick={() => selectMethod(m.id)}
            className={`press shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              m.id === methodId ? 'bg-ink text-paper' : 'card text-ink/70'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* selector de café (opcional); su receta sobrescribe los defaults */}
      {coffees.length > 0 && (
        <CoffeeSelect
          coffees={coffees}
          value={coffeeId}
          onChange={selectCoffee}
          emptyLabel="— Sin café concreto (defaults del método) —"
          className="card w-full px-3 py-3 text-base"
        />
      )}

      <Link to="/referencias" className="press text-center text-xs font-semibold text-copper">
        📖 Recetas de referencia →
      </Link>

      {/* calculadora inversa */}
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <p className="uppercase text-xs text-copper">calculadora</p>
          {recipe && <span className="text-xs font-semibold text-leaf">receta propia</span>}
        </div>

        <div className="mt-3 flex items-end gap-3">
          <label className="flex-1">
            <span className="text-xs text-ink/60">Café (g)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={doseG || ''}
              onChange={(e) => setDoseOverride(Number(e.target.value))}
              className="card mt-1 w-full px-3 py-3 text-center text-2xl"
              data-numeric
            />
          </label>
          <span className="pb-3 text-xl text-ink/40">⇄</span>
          <label className="flex-1">
            <span className="text-xs text-ink/60">
              {method.family === 'espresso' ? 'En taza (g)' : 'Agua (g)'}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              value={waterG || ''}
              onChange={(e) => setDoseOverride(coffeeForWater(Number(e.target.value), ratio))}
              className="card mt-1 w-full px-3 py-3 text-center text-2xl"
              data-numeric
            />
          </label>
        </div>

        {/* ratio ajustable al vuelo sin tocar receta ni defaults */}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-crema/50 px-3 py-2">
          <button
            onClick={() => setRatioOverride(Math.max(1, Math.round((ratio - 0.5) * 10) / 10))}
            className="press h-9 w-9 rounded-full bg-card font-bold"
            aria-label="Ratio más corto"
          >
            −
          </button>
          <div className="text-center">
            <p className="font-display text-xl" data-numeric>{formatRatio(ratio)}</p>
            <p className="text-xs text-ink/60" data-numeric>{tempC} °C</p>
          </div>
          <button
            onClick={() => setRatioOverride(Math.round((ratio + 0.5) * 10) / 10)}
            className="press h-9 w-9 rounded-full bg-card font-bold"
            aria-label="Ratio más largo"
          >
            +
          </button>
        </div>

        {(ratioOverride !== null || doseOverride !== null) && (
          <button
            onClick={() => {
              setRatioOverride(null)
              setDoseOverride(null)
            }}
            className="press mt-2 w-full py-1 text-center text-xs font-semibold text-copper"
          >
            ↺ Restablecer {recipe ? 'receta' : 'defaults del método'}
          </button>
        )}
      </div>

      {/* cronómetro: simple o por fases según el método */}
      <BrewTimer
        method={method}
        totalWaterG={waterG || null}
        onRegister={(timeS) =>
          navigate('/diario/nueva', {
            state: {
              method: methodId,
              coffeeId: coffeeId || null,
              recipeId: recipe?.id ?? null,
              doseG,
              waterG,
              timeS,
              // del repetir viajan molienda/molinillo/paquete; si no, paquete óptimo
              bagId: repeatExtras?.bag_id ?? (coffeeId ? activeBagFor(bags, coffeeId, today) : null),
              grind: repeatExtras?.grind_setting ?? null,
              grinderId: repeatExtras?.grinder_id ?? null,
              grindValue: repeatExtras?.grind_value ?? null,
            },
          })
        }
      />
    </section>
  )
}
