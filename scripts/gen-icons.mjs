// Genera public/pwa-192.png y public/pwa-512.png sin dependencias:
// taza de café vista desde arriba sobre papel crema (paleta Carta de tostador).
// Uso: node scripts/gen-icons.mjs
import { deflateSync, crc32 } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const PAPER = [0xf8, 0xf3, 0xea]
const INK = [0x2b, 0x21, 0x1b]
const COFFEE = [0x4a, 0x30, 0x20]
const CREMA = [0xc8, 0x90, 0x58]
const CARAMEL = [0xa9, 0x70, 0x3d]

function drawIcon(size) {
  const px = new Uint8Array(size * size * 3)
  const cx = size / 2
  const cy = size / 2
  const R = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const d = Math.hypot(dx, dy) / R // distancia normalizada al centro
      let c = PAPER
      // platillo: anillo caramelo fino
      if (d < 0.62 && d > 0.56) c = CARAMEL
      // asa: pastilla a la derecha
      else if (Math.abs(dy) < R * 0.09 && dx > R * 0.40 && dx < R * 0.55) c = INK
      // borde de la taza
      else if (d < 0.45 && d > 0.40) c = INK
      // crema: anillo interior
      else if (d <= 0.40 && d > 0.30) c = CREMA
      // café
      else if (d <= 0.30) c = COFFEE
      const i = (y * size + x) * 3
      px[i] = c[0]
      px[i + 1] = c[1]
      px[i + 2] = c[2]
    }
  }
  return px
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([len, body, crc])
}

function png(size, px) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  // scanlines con byte de filtro 0
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    px.subarray(y * size * 3, (y + 1) * size * 3).forEach((v, i) => {
      raw[y * (size * 3 + 1) + 1 + i] = v
    })
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(new URL('../public', import.meta.url), { recursive: true })
for (const size of [192, 512]) {
  const file = new URL(`../public/pwa-${size}.png`, import.meta.url)
  writeFileSync(file, png(size, drawIcon(size)))
  console.log(`✓ public/pwa-${size}.png`)
}
