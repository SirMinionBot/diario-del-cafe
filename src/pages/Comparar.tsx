import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { METHODS } from '../lib/methods.ts'
import { formatRatio, ratioFor } from '../lib/ratio.ts'
import { formatTime } from '../lib/timer.ts'
import { parseTasting, TASTING_AXES, type Tasting } from '../lib/tasting.ts'
import type { Brew, Coffee } from '../types.ts'

const COLOR_A = '#a9703d' // caramelo
const COLOR_B = '#65775a' // hoja

/** Radar SVG de 4 ejes con hasta dos perfiles superpuestos (spec brew-compare). */
function Radar({ a, b }: { a: Tasting | null; b: Tasting | null }) {
  const size = 220
  const c = size / 2
  const r = 80
  // acidez arriba, cuerpo derecha, dulzor abajo, amargor izquierda
  const angles = [-90, 0, 90, 180].map((deg) => (deg * Math.PI) / 180)
  const point = (axis: number, value: number) =>
    `${c + Math.cos(angles[axis]) * r * (value / 5)},${c + Math.sin(angles[axis]) * r * (value / 5)}`
  const polygon = (t: Tasting) => TASTING_AXES.map((ax, i) => point(i, t[ax])).join(' ')
  const labels = ['acidez', 'cuerpo', 'dulzor', 'amargor']
  const labelPos = [
    { x: c, y: c - r - 12, anchor: 'middle' },
    { x: c + r + 10, y: c + 4, anchor: 'start' },
    { x: c, y: c + r + 20, anchor: 'middle' },
    { x: c - r - 10, y: c + 4, anchor: 'end' },
  ]
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-60">
      {[1, 2, 3, 4, 5].map((ring) => (
        <polygon
          key={ring}
          points={TASTING_AXES.map((_, i) => point(i, ring)).join(' ')}
          fill="none"
          stroke="rgba(43,33,27,0.1)"
        />
      ))}
      {angles.map((ang, i) => (
        <line key={i} x1={c} y1={c} x2={c + Math.cos(ang) * r} y2={c + Math.sin(ang) * r}
          stroke="rgba(43,33,27,0.15)" />
      ))}
      {a && <polygon points={polygon(a)} fill={`${COLOR_A}55`} stroke={COLOR_A} strokeWidth="2" />}
      {b && <polygon points={polygon(b)} fill={`${COLOR_B}55`} stroke={COLOR_B} strokeWidth="2" />}
      {labels.map((l, i) => (
        <text key={l} x={labelPos[i].x} y={labelPos[i].y} textAnchor={labelPos[i].anchor as 'middle'}
          className="fill-ink/60" fontSize="11">
          {l}
        </text>
      ))}
    </svg>
  )
}

export default function Comparar() {
  const [params] = useSearchParams()
  const idA = params.get('a')
  const idB = params.get('b')
  const [brews, setBrews] = useState<Brew[] | null>(null)
  const [coffees, setCoffees] = useState<Coffee[]>([])

  useEffect(() => {
    if (!idA || !idB) return
    let cancelled = false
    void Promise.all([
      supabase.from('brews').select('*').in('id', [idA, idB]),
      supabase.from('coffees').select('*'),
    ]).then(([b, c]) => {
      if (cancelled) return
      const rows = (b.data as Brew[] | null) ?? []
      // orden estable: A = el primero de la URL
      rows.sort((x) => (x.id === idA ? -1 : 1))
      setBrews(rows)
      setCoffees((c.data as Coffee[] | null) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [idA, idB])

  if (!idA || !idB) return <p className="text-sm text-ink/60">Faltan extracciones que comparar.</p>
  if (!brews) return null
  if (brews.length < 2) return <p className="text-sm text-ink/60">No se encontraron las dos extracciones.</p>

  const [a, b] = brews
  const names = new Map(coffees.map((c) => [c.id, c.name]))
  const tastingA = parseTasting(a.tasting)
  const tastingB = parseTasting(b.tasting)

  const rows: { label: string; va: string; vb: string }[] = [
    { label: 'Café', va: names.get(a.coffee_id) ?? '—', vb: names.get(b.coffee_id) ?? '—' },
    { label: 'Método', va: METHODS[a.method]?.name ?? a.method, vb: METHODS[b.method]?.name ?? b.method },
    { label: 'Dosis', va: `${a.dose_g} g`, vb: `${b.dose_g} g` },
    { label: 'Agua', va: a.water_g ? `${a.water_g} g` : '—', vb: b.water_g ? `${b.water_g} g` : '—' },
    {
      label: 'Ratio',
      va: a.water_g ? formatRatio(ratioFor(a.dose_g, a.water_g)!) : '—',
      vb: b.water_g ? formatRatio(ratioFor(b.dose_g, b.water_g)!) : '—',
    },
    { label: 'Temperatura', va: a.water_temp_c ? `${a.water_temp_c} °C` : '—', vb: b.water_temp_c ? `${b.water_temp_c} °C` : '—' },
    { label: 'Tiempo', va: a.time_s ? formatTime(a.time_s) : '—', vb: b.time_s ? formatTime(b.time_s) : '—' },
    { label: 'Molienda', va: a.grind_setting ?? (a.grind_value?.toString() ?? '—'), vb: b.grind_setting ?? (b.grind_value?.toString() ?? '—') },
    { label: 'Valoración', va: a.rating ? '⭐'.repeat(a.rating) : '—', vb: b.rating ? '⭐'.repeat(b.rating) : '—' },
    { label: 'Sabor', va: a.taste_label ?? '—', vb: b.taste_label ?? '—' },
  ]

  return (
    <section>
      <Link to="/diario" className="text-sm text-copper">← Diario</Link>
      <h1 className="mt-1 text-3xl">Comparar</h1>

      <div className="card mt-4 overflow-hidden">
        <div className="flex border-b hairline text-xs font-semibold">
          <span className="w-24 shrink-0 p-2" />
          <span className="flex-1 p-2" style={{ color: COLOR_A }}>A · {a.brewed_at.slice(0, 10)}</span>
          <span className="flex-1 p-2" style={{ color: COLOR_B }}>B · {b.brewed_at.slice(0, 10)}</span>
        </div>
        {rows.map((row) => {
          const differs = row.va !== row.vb
          return (
            <div key={row.label}
              className={`flex border-b hairline text-sm last:border-b-0 ${differs ? 'bg-crema/40 font-semibold' : ''}`}>
              <span className="w-24 shrink-0 p-2 text-xs text-ink/55">{row.label}</span>
              <span className="flex-1 p-2" data-numeric>{row.va}</span>
              <span className="flex-1 p-2" data-numeric>{row.vb}</span>
            </div>
          )
        })}
      </div>

      <div className="card mt-4 p-4">
        <p className="uppercase text-xs text-copper">perfil sensorial</p>
        {tastingA || tastingB ? (
          <>
            <Radar a={tastingA} b={tastingB} />
            <div className="mt-1 flex justify-center gap-4 text-xs">
              <span style={{ color: COLOR_A }}>■ A</span>
              <span style={{ color: COLOR_B }}>■ B</span>
            </div>
            {(!tastingA || !tastingB) && (
              <p className="mt-2 text-center text-xs text-ink/50">
                {!tastingA ? 'A' : 'B'} no tiene cata registrada.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-ink/60">Ninguna de las dos tiene cata registrada.</p>
        )}
      </div>
    </section>
  )
}
