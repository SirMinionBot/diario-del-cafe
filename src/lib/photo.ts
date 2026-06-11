// Compresión de fotos en cliente antes de subir (design D7, spec brew-log):
// redimensiona a ~1280 px de lado mayor y exporta JPEG q0.8.

const MAX_SIDE = 1280
const QUALITY = 0.8

export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la foto'))),
      'image/jpeg',
      QUALITY,
    )
  })
}
