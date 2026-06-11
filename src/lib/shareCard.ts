// Tarjeta de receta compartible (spec recipe-sharing, design D6): se renderiza
// a canvas con la estética Carta de tostador y se comparte como imagen vía
// Web Share API, con fallback a descarga. Sin URLs públicas: solo los
// parámetros visibles de la receta.

import { formatRatio } from './ratio.ts'
import { formatTime } from './timer.ts'
import { axisPoint, RADAR_AXIS_LABELS, ringPolygon, tastingPolygon } from './radar.ts'
import type { Tasting } from './tasting.ts'

export type RecipeCardInput = {
  coffeeName: string
  methodName: string
  ratio: number
  doseG: number
  waterG: number
  grind?: string | null
  tempC?: number | null
  targetTimeS?: number | null
}

const W = 1080
const H = 1350

function drawCard(input: RecipeCardInput): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // papel + doble regla hairline de etiqueta
  ctx.fillStyle = '#f8f3ea'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(43, 33, 27, 0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(48, 48, W - 96, H - 96)
  ctx.lineWidth = 1.5
  ctx.strokeRect(64, 64, W - 128, H - 128)

  ctx.fillStyle = '#8a4b2b'
  ctx.font = '600 34px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('R E C E T A   D E   C A F É', W / 2, 170)

  ctx.fillStyle = '#2b211b'
  ctx.font = '400 88px "DM Serif Display", serif'
  ctx.fillText(fit(ctx, input.coffeeName, W - 220), W / 2, 300)

  ctx.fillStyle = '#a9703d'
  ctx.font = '600 48px Inter, sans-serif'
  ctx.fillText(input.methodName, W / 2, 380)

  // ratio protagonista
  ctx.fillStyle = '#2b211b'
  ctx.font = '400 200px "DM Serif Display", serif'
  ctx.fillText(formatRatio(input.ratio), W / 2, 640)

  // parámetros en dos columnas
  const rows: [string, string][] = [
    ['CAFÉ', `${input.doseG} g`],
    ['AGUA', `${input.waterG} g`],
  ]
  if (input.tempC) rows.push(['TEMPERATURA', `${input.tempC} °C`])
  if (input.targetTimeS) rows.push(['TIEMPO', formatTime(input.targetTimeS)])
  if (input.grind) rows.push(['MOLIENDA', input.grind])

  let y = 800
  for (const [k, v] of rows) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#8a4b2b'
    ctx.font = '600 30px Inter, sans-serif'
    ctx.fillText(k, 160, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#2b211b'
    ctx.font = '600 44px Inter, sans-serif'
    ctx.fillText(v, W - 160, y)
    ctx.strokeStyle = 'rgba(43, 33, 27, 0.15)'
    ctx.beginPath()
    ctx.moveTo(160, y + 24)
    ctx.lineTo(W - 160, y + 24)
    ctx.stroke()
    y += 90
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(43, 33, 27, 0.45)'
  ctx.font = '500 28px Inter, sans-serif'
  ctx.fillText('diario del café', W / 2, H - 110)

  return canvas
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  let t = text
  while (t.length > 4 && ctx.measureText(t).width > maxW) t = `${t.slice(0, -2)}…`
  return t
}

/** Comparte un canvas como imagen con Web Share API; fallback a descarga. */
async function shareCanvas(canvas: HTMLCanvasElement, filename: string, title: string): Promise<void> {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas vacío'))), 'image/png'),
  )
  const file = new File([blob], filename, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return
    } catch {
      // cancelado por el usuario o no permitido: caer a descarga
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Comparte la tarjeta de receta con Web Share API; si no se puede, la descarga. */
export async function shareRecipeCard(input: RecipeCardInput): Promise<void> {
  // asegurar que las fuentes de display están cargadas antes de pintar
  await document.fonts.load('400 88px "DM Serif Display"').catch(() => {})
  await shareCanvas(drawCard(input), 'receta-cafe.png', `Receta · ${input.coffeeName}`)
}

// ─── tarjeta de extracción con radar (delta recipe-sharing, iteración 3) ─────

export type BrewCardInput = {
  coffeeName: string
  methodName: string
  doseG: number
  waterG: number | null
  ratio: number | null
  timeS: number | null
  rating: number | null
  dateIso: string
  tasting: Tasting | null
}

function drawBrewCard(input: BrewCardInput): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#f8f3ea'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(43, 33, 27, 0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(48, 48, W - 96, H - 96)
  ctx.lineWidth = 1.5
  ctx.strokeRect(64, 64, W - 128, H - 128)

  ctx.fillStyle = '#8a4b2b'
  ctx.font = '600 34px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('C A T A   D E   C A F É', W / 2, 160)

  ctx.fillStyle = '#2b211b'
  ctx.font = '400 80px "DM Serif Display", serif'
  ctx.fillText(fit(ctx, input.coffeeName, W - 220), W / 2, 280)

  ctx.fillStyle = '#a9703d'
  ctx.font = '600 42px Inter, sans-serif'
  ctx.fillText(`${input.methodName} · ${input.dateIso.slice(0, 10)}`, W / 2, 350)

  // centro: radar con la MISMA geometría que el comparador, o el ratio si no hay cata
  if (input.tasting) {
    const cx = W / 2
    const cy = 620
    const r = 190
    ctx.strokeStyle = 'rgba(43, 33, 27, 0.15)'
    ctx.lineWidth = 1.5
    for (let level = 1; level <= 5; level++) {
      const ring = ringPolygon(level, cx, cy, r)
      ctx.beginPath()
      ring.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.closePath()
      ctx.stroke()
    }
    const poly = tastingPolygon(input.tasting, cx, cy, r)
    ctx.beginPath()
    poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.closePath()
    ctx.fillStyle = 'rgba(169, 112, 61, 0.35)'
    ctx.fill()
    ctx.strokeStyle = '#a9703d'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = '#8a4b2b'
    ctx.font = '600 28px Inter, sans-serif'
    for (const [i, l] of RADAR_AXIS_LABELS.entries()) {
      const tip = axisPoint(i, 5, cx, cy, r)
      ctx.textAlign = l.dx > 0 ? 'left' : l.dx < 0 ? 'right' : 'center'
      ctx.fillText(l.label, tip.x + l.dx * 16, tip.y + l.dy * 34 + 10)
    }
  } else if (input.ratio) {
    ctx.fillStyle = '#2b211b'
    ctx.font = '400 190px "DM Serif Display", serif'
    ctx.fillText(formatRatio(input.ratio), W / 2, 660)
  }

  const rows: [string, string][] = [['CAFÉ', `${input.doseG} g`]]
  if (input.waterG) rows.push(['AGUA / TAZA', `${input.waterG} g`])
  if (input.ratio) rows.push(['RATIO', formatRatio(input.ratio)])
  if (input.timeS) rows.push(['TIEMPO', formatTime(input.timeS)])
  if (input.rating) rows.push(['VALORACIÓN', '★'.repeat(input.rating)])

  let y = 940
  ctx.lineWidth = 1
  for (const [k, v] of rows) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#8a4b2b'
    ctx.font = '600 28px Inter, sans-serif'
    ctx.fillText(k, 160, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#2b211b'
    ctx.font = '600 40px Inter, sans-serif'
    ctx.fillText(v, W - 160, y)
    ctx.strokeStyle = 'rgba(43, 33, 27, 0.15)'
    ctx.beginPath()
    ctx.moveTo(160, y + 20)
    ctx.lineTo(W - 160, y + 20)
    ctx.stroke()
    y += 76
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(43, 33, 27, 0.45)'
  ctx.font = '500 28px Inter, sans-serif'
  ctx.fillText('diario del café', W / 2, H - 100)

  return canvas
}

/** Comparte la tarjeta de una extracción (parámetros + radar si hay cata). */
export async function shareBrewCard(input: BrewCardInput): Promise<void> {
  await document.fonts.load('400 80px "DM Serif Display"').catch(() => {})
  await shareCanvas(drawBrewCard(input), 'cata-cafe.png', `Cata · ${input.coffeeName}`)
}
