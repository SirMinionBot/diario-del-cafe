import { useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import { parseLabel, type ParsedLabel } from '../lib/ocrParse.ts'

/**
 * Escáner de etiquetas (spec label-scanner, design D2): tesseract.js se carga
 * SOLO al usarlo (import dinámico) y el OCR corre íntegro en el dispositivo.
 * El resultado solo prerellena: el formulario sigue siendo del usuario.
 */
export default function LabelScanner({ onResult }: { onResult: (parsed: ParsedLabel) => void }) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)

  async function scan(file: File) {
    setBusy(true)
    setFailed(false)
    setProgress(0)
    try {
      const [{ default: Tesseract }, roastersRes] = await Promise.all([
        import('tesseract.js'),
        supabase.from('coffees').select('roaster').not('roaster', 'is', null),
      ])
      const known = [
        ...new Set(((roastersRes.data as { roaster: string }[] | null) ?? []).map((r) => r.roaster)),
      ]
      const { data } = await Tesseract.recognize(file, 'spa', {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        },
      })
      const parsed = parseLabel(data.text, known)
      const empty = !parsed.name && !parsed.roaster && !parsed.origin && !parsed.roastDate
      if (empty) setFailed(true)
      else onResult(parsed)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label className={`press flex items-center justify-center gap-2 rounded-xl border hairline py-2.5 text-sm font-semibold ${busy ? 'opacity-60' : ''}`}>
        📷 {busy ? `Leyendo etiqueta… ${progress}%` : 'Escanear etiqueta'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void scan(f)
            e.target.value = ''
          }}
        />
      </label>
      {failed && (
        <p className="mt-1 text-xs text-warn">
          No se reconoció la etiqueta; rellena los campos a mano.
        </p>
      )}
    </div>
  )
}
