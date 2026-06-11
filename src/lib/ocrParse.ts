// Parser puro del texto OCR de etiquetas (spec label-scanner, design D2).
// Recibe texto crudo y el catálogo del usuario; devuelve candidatos para
// PRERELLENAR el formulario. Nunca decide por el usuario.

export type ParsedLabel = {
  name: string | null
  roaster: string | null
  origin: string | null
  /** fecha de tueste en ISO yyyy-mm-dd */
  roastDate: string | null
}

const MONTHS_ES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
}

// SIN tildes: se comparan contra texto normalizado. La clave es la forma
// normalizada; el valor, cómo mostrarla.
const ORIGINS: Record<string, string> = {
  colombia: 'Colombia', etiopia: 'Etiopía', brasil: 'Brasil', kenia: 'Kenia',
  guatemala: 'Guatemala', honduras: 'Honduras', peru: 'Perú',
  'costa rica': 'Costa Rica', ruanda: 'Ruanda', burundi: 'Burundi',
  mexico: 'México', panama: 'Panamá', yemen: 'Yemen', india: 'India',
  indonesia: 'Indonesia', vietnam: 'Vietnam', 'el salvador': 'El Salvador',
  nicaragua: 'Nicaragua', bolivia: 'Bolivia', ecuador: 'Ecuador',
  tanzania: 'Tanzania', uganda: 'Uganda',
}

/** palabras que delatan la línea del tostador en una etiqueta */
const ROASTER_HINTS = /\b(coffee|cafe|roaster|roasters|roastery|tostador|tostadores|tostaduria|specialty)\b/

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** proporción de caracteres alfabéticos: filtra líneas de ruido del OCR */
function letterRatio(line: string): number {
  const letters = line.match(/[a-záéíóúñü]/gi)?.length ?? 0
  return letters / line.length
}

function toIso(d: number, m: number, y: number): string | null {
  if (y < 100) y += 2000
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Similitud Dice sobre bigramas (0..1) para el matching de tostadores. */
export function similarity(a: string, b: string): number {
  const bigrams = (s: string) => {
    const n = normalize(s).replace(/\s+/g, ' ')
    const out = new Map<string, number>()
    for (let i = 0; i < n.length - 1; i++) {
      const bg = n.slice(i, i + 2)
      out.set(bg, (out.get(bg) ?? 0) + 1)
    }
    return out
  }
  const A = bigrams(a)
  const B = bigrams(b)
  if (A.size === 0 || B.size === 0) return normalize(a) === normalize(b) ? 1 : 0
  let overlap = 0
  for (const [bg, count] of A) overlap += Math.min(count, B.get(bg) ?? 0)
  const total = [...A.values()].reduce((s, c) => s + c, 0) + [...B.values()].reduce((s, c) => s + c, 0)
  return (2 * overlap) / total
}

const ROASTER_MATCH_THRESHOLD = 0.7

/** Fecha de tueste: prioriza la fecha más próxima a «tostado»/«tueste»/«roast». */
function findRoastDate(text: string): string | null {
  const lower = normalize(text)
  const numeric = [...text.matchAll(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/g)]
  const textual = [...lower.matchAll(/(\d{1,2})\s+de\s+([a-z]+)(?:\s+de)?\s+(\d{4})/g)]

  const candidates: { iso: string; index: number }[] = []
  for (const m of numeric) {
    const iso = toIso(Number(m[1]), Number(m[2]), Number(m[3]))
    if (iso) candidates.push({ iso, index: m.index ?? 0 })
  }
  for (const m of textual) {
    const month = MONTHS_ES[m[2]]
    if (!month) continue
    const iso = toIso(Number(m[1]), month, Number(m[3]))
    if (iso) candidates.push({ iso, index: m.index ?? 0 })
  }
  if (candidates.length === 0) return null

  const tostIdx = lower.search(/tost|tuest|roast/)
  if (tostIdx >= 0) {
    candidates.sort((a, b) => Math.abs(a.index - tostIdx) - Math.abs(b.index - tostIdx))
  }
  return candidates[0].iso
}

export function parseLabel(text: string, knownRoasters: string[]): ParsedLabel {
  // líneas con sustancia: largo mínimo y mayoría de letras (fuera ruido OCR)
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length >= 3 && letterRatio(l) >= 0.5)

  // 1) tostador conocido: mejor match difuso contra el catálogo (evita duplicados)
  let roaster: string | null = null
  let best = ROASTER_MATCH_THRESHOLD
  for (const line of lines) {
    for (const known of knownRoasters) {
      const score = similarity(line, known)
      if (score >= best) {
        best = score
        roaster = known
      }
    }
  }
  // 2) tostador nuevo: línea con pinta de marca (coffee/roasters/tostador…)
  if (!roaster) {
    const hinted = lines.find((l) => ROASTER_HINTS.test(normalize(l)))
    if (hinted) roaster = hinted
  }

  // origen: primer país presente en el texto normalizado
  const lower = normalize(text)
  const originKey = Object.keys(ORIGINS).find((o) => lower.includes(o))
  const origin = originKey ? ORIGINS[originKey] : null

  // nombre: línea más larga de la mitad superior que no sea fecha ni el tostador
  const upperHalf = lines.slice(0, Math.max(3, Math.ceil(lines.length / 2)))
  const name =
    upperHalf
      .filter((l) => !/\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/.test(l))
      .filter((l) => !roaster || similarity(l, roaster) < ROASTER_MATCH_THRESHOLD)
      .sort((a, b) => b.length - a.length)[0] ?? null

  return { name, roaster, origin, roastDate: findRoastDate(text) }
}
