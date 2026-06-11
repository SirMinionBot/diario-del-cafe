// Tarjeta de receta compartible (spec recipe-sharing, design D6): se renderiza
// a canvas con la estética Carta de tostador y se comparte como imagen vía
// Web Share API, con fallback a descarga. Sin URLs públicas: solo los
// parámetros visibles de la receta.

import { formatRatio } from './ratio.ts'
import { formatTime } from './timer.ts'

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

/** Comparte la tarjeta con Web Share API; si no se puede, la descarga. */
export async function shareRecipeCard(input: RecipeCardInput): Promise<void> {
  // asegurar que las fuentes de display están cargadas antes de pintar
  await document.fonts.load('400 88px "DM Serif Display"').catch(() => {})
  const canvas = drawCard(input)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas vacío'))), 'image/png'),
  )
  const file = new File([blob], 'receta-cafe.png', { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Receta · ${input.coffeeName}` })
      return
    } catch {
      // cancelado por el usuario o no permitido: caer a descarga
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'receta-cafe.png'
  a.click()
  URL.revokeObjectURL(url)
}
