// Genera public/pwa-192.png y public/pwa-512.png sin dependencias:
// cafetera moka estilizada sobre papel crema (paleta Carta de tostador).
// Uso: node scripts/gen-icons.mjs
import { deflateSync, crc32 } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const PAPER = [0xf8, 0xf3, 0xea]
const INK = [0x2b, 0x21, 0x1b]
const CREMA = [0xc8, 0x90, 0x58]
const CARAMEL = [0xa9, 0x70, 0x3d]

// silueta de moka por segmentos verticales: entre y0..y1 la media anchura
// interpola w0→w1 (coordenadas normalizadas 0..1, y hacia abajo)
const BODY = [
  { y0: 0.2, y1: 0.24, w0: 0.1, w1: 0.21, color: INK }, // tapa
  { y0: 0.24, y1: 0.47, w0: 0.21, w1: 0.13, color: INK }, // cámara superior (se estrecha)
  { y0: 0.47, y1: 0.53, w0: 0.11, w1: 0.11, color: CREMA }, // cintura/junta
  { y0: 0.53, y1: 0.82, w0: 0.13, w1: 0.22, color: INK }, // cámara inferior (se abre)
  { y0: 0.82, y1: 0.86, w0: 0.19, w1: 0.17, color: INK }, // base
]

function bodyColorAt(nx, ny) {
  for (const s of BODY) {
    if (ny >= s.y0 && ny < s.y1) {
      const t = (ny - s.y0) / (s.y1 - s.y0)
      const half = s.w0 + (s.w1 - s.w0) * t
      if (Math.abs(nx - 0.46) <= half) return s.color
    }
  }
  return null
}

function drawIcon(size) {
  const px = new Uint8Array(size * size * 3)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size
      const ny = (y + 0.5) / size
      let c = PAPER

      // pomo: bolita caramelo sobre la tapa
      if (Math.hypot(nx - 0.46, ny - 0.165) < 0.045) c = CARAMEL
      // asa en L a la derecha
      else if (nx >= 0.66 && nx <= 0.8 && ny >= 0.26 && ny <= 0.31) c = INK
      else if (nx >= 0.74 && nx <= 0.8 && ny >= 0.26 && ny <= 0.5) c = INK
      else c = bodyColorAt(nx, ny) ?? PAPER

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
