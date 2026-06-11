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
  const [rawText, setRawText] = useState<string | null>(null)
  const [detected, setDetected] = useState<string[] | null>(null)

  async function scan(file: File) {
    setBusy(true)
    setDetected(null)
    setRawText(null)
    setProgress(0)
    try {
      const [{ default: Tesseract }, roastersRes] = await Promise.all([
        import('tesseract.js'),
        supabase.from('coffees').select('roaster').not('roaster', 'is', null),
      ])
      const known = [
        ...new Set(((roastersRes.data as { roaster: string }[] | null) ?? []).map((r) => r.roaster)),
      ]
      // spa+eng: las etiquetas de especialidad mezclan ambos idiomas
      const { data } = await Tesseract.recognize(file, 'spa+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        },
      })
      setRawText(data.text.trim() || null)
      const parsed = parseLabel(data.text, known)
      const found = [
        parsed.name && 'nombre',
        parsed.roaster && 'tostador',
        parsed.origin && 'origen',
        parsed.roastDate && 'fecha de tueste',
      ].filter((x): x is string => Boolean(x))
      setDetected(found)
      if (found.length > 0) onResult(parsed)
    } catch {
      setDetected([])
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

      {detected !== null && (
        <p className={`mt-1 text-xs ${detected.length ? 'text-leaf' : 'text-warn'}`}>
          {detected.length
            ? `✓ Detectado: ${detected.join(', ')}. Revisa y corrige lo que haga falta.`
            : 'No se reconoció nada útil; rellena los campos a mano.'}
        </p>
      )}

      {rawText && (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs text-ink/50">Ver texto leído por el OCR</summary>
          <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-crema/40 p-2 text-[11px] text-ink/70">
            {rawText}
          </pre>
        </details>
      )}
    </div>
  )
}
