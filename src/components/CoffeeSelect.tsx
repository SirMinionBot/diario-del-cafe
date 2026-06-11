import { useMemo } from 'react'
import type { Coffee } from '../types.ts'

type Props = {
  coffees: Coffee[]
  value: string
  onChange: (id: string) => void
  emptyLabel: string
  required?: boolean
  className?: string
}

/**
 * Selector de café agrupado por tostador (delta spec brand-ranking):
 * con catálogos grandes, «Colombia» a secas es ambiguo — el optgroup
 * de la marca desambigua sin alargar cada opción.
 */
export default function CoffeeSelect({ coffees, value, onChange, emptyLabel, required, className }: Props) {
  const groups = useMemo(() => {
    const byRoaster = new Map<string, Coffee[]>()
    for (const c of coffees) {
      const key = c.roaster ?? 'Otros'
      byRoaster.set(key, [...(byRoaster.get(key) ?? []), c])
    }
    return [...byRoaster.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [coffees])

  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{emptyLabel}</option>
      {groups.map(([roaster, list]) => (
        <optgroup key={roaster} label={roaster}>
          {list.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
