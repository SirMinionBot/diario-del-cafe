import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { translateSetting } from '../lib/grinders.ts'
import type { Grinder } from '../types.ts'

const input = 'card mt-1 w-full px-3 py-2.5 text-base'
const label = 'text-xs text-ink/60'

function toRange(g: Grinder) {
  return { name: g.name, minSetting: g.min_setting, maxSetting: g.max_setting, step: g.step ?? 1 }
}

export default function Molinillos() {
  const [grinders, setGrinders] = useState<Grinder[]>([])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', min_setting: '', max_setting: '', step: '1' })

  // traductor (spec grinder-profiles)
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [value, setValue] = useState('')

  useEffect(() => {
    let cancelled = false
    void supabase.from('grinders').select('*').order('name').then(({ data }) => {
      if (!cancelled) setGrinders((data as Grinder[] | null) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function addGrinder(e: FormEvent) {
    e.preventDefault()
    const { data } = await supabase
      .from('grinders')
      .insert({
        name: draft.name.trim(),
        min_setting: draft.min_setting ? Number(draft.min_setting) : null,
        max_setting: draft.max_setting ? Number(draft.max_setting) : null,
        step: draft.step ? Number(draft.step) : 1,
      })
      .select()
      .single()
    if (data) setGrinders([...grinders, data as Grinder].sort((a, b) => a.name.localeCompare(b.name)))
    setDraft({ name: '', min_setting: '', max_setting: '', step: '1' })
    setAdding(false)
  }

  async function removeGrinder(id: string) {
    await supabase.from('grinders').delete().eq('id', id)
    setGrinders(grinders.filter((g) => g.id !== id))
  }

  const from = grinders.find((g) => g.id === fromId)
  const to = grinders.find((g) => g.id === toId)
  const result =
    from && to && value !== '' ? translateSetting(Number(value), toRange(from), toRange(to)) : null

  return (
    <section>
      <Link to="/perfil" className="text-sm text-copper">← Perfil</Link>
      <div className="mt-1 flex items-end justify-between">
        <h1 className="text-3xl">Molinillos</h1>
        <button onClick={() => setAdding(!adding)}
          className="press rounded-xl bg-caramel px-4 py-2.5 text-sm font-semibold text-white">
          {adding ? '✕' : '+ Nuevo'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addGrinder} className="card mt-4 flex flex-col gap-3 p-4">
          <label>
            <span className={label}>Nombre / modelo *</span>
            <input required value={draft.name} placeholder="Comandante C40"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={input} />
          </label>
          <div className="flex gap-3">
            <label className="flex-1">
              <span className={label}>Ajuste mín.</span>
              <input type="number" inputMode="decimal" step="0.5" value={draft.min_setting}
                onChange={(e) => setDraft({ ...draft, min_setting: e.target.value })} className={input} data-numeric />
            </label>
            <label className="flex-1">
              <span className={label}>Ajuste máx.</span>
              <input type="number" inputMode="decimal" step="0.5" value={draft.max_setting}
                onChange={(e) => setDraft({ ...draft, max_setting: e.target.value })} className={input} data-numeric />
            </label>
            <label className="w-20">
              <span className={label}>Paso</span>
              <input type="number" inputMode="decimal" step="0.5" min="0.5" value={draft.step}
                onChange={(e) => setDraft({ ...draft, step: e.target.value })} className={input} data-numeric />
            </label>
          </div>
          <button type="submit" className="press rounded-xl bg-caramel py-2.5 font-semibold text-white">
            Guardar molinillo
          </button>
        </form>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {grinders.map((g) => (
          <li key={g.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{g.name}</p>
              <p className="text-xs text-ink/55" data-numeric>
                {g.min_setting !== null && g.max_setting !== null
                  ? `rango ${g.min_setting}–${g.max_setting} · paso ${g.step ?? 1}`
                  : 'sin rango definido'}
              </p>
            </div>
            <button onClick={() => removeGrinder(g.id)}
              className="press text-sm font-semibold text-danger" aria-label={`Eliminar ${g.name}`}>
              Eliminar
            </button>
          </li>
        ))}
        {grinders.length === 0 && !adding && (
          <li className="card p-4 text-sm text-ink/70">
            Registra tus molinillos para asociarlos a recetas y traducir ajustes entre ellos.
          </li>
        )}
      </ul>

      {grinders.length >= 2 && (
        <div className="card mt-6 p-4">
          <p className="uppercase text-xs text-copper">traducir ajuste</p>
          <div className="mt-2 flex items-end gap-2">
            <label className="flex-1">
              <span className={label}>De</span>
              <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={input}>
                <option value="">—</option>
                {grinders.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
            <label className="w-20">
              <span className={label}>Ajuste</span>
              <input type="number" inputMode="decimal" step="0.5" value={value}
                onChange={(e) => setValue(e.target.value)} className={input} data-numeric />
            </label>
            <label className="flex-1">
              <span className={label}>A</span>
              <select value={toId} onChange={(e) => setToId(e.target.value)} className={input}>
                <option value="">—</option>
                {grinders.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
          </div>
          {result && (
            <p className="mt-3 text-center">
              {result.ok ? (
                <span className="font-display text-2xl" data-numeric>≈ {result.value}</span>
              ) : result.reason === 'missing-range' ? (
                <span className="text-sm text-warn">«{result.grinderName}» no tiene rango definido.</span>
              ) : (
                <span className="text-sm text-warn">El ajuste está fuera del rango del molinillo de origen.</span>
              )}
            </p>
          )}
          <p className="mt-2 text-center text-[11px] text-ink/45">
            Traducción lineal aproximada: úsala como punto de partida, no como verdad.
          </p>
        </div>
      )}
    </section>
  )
}
