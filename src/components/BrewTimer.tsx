import { useEffect, useRef, useState } from 'react'
import type { BrewMethod } from '../lib/methods.ts'
import { formatTime, phaseAt } from '../lib/timer.ts'

type Props = {
  method: BrewMethod
  /** agua total calculada (para los objetivos de agua por fase); null si no se conoce */
  totalWaterG: number | null
  onRegister: (timeS: number) => void
}

/**
 * Cronómetro de extracción (spec brew-timer). La fuente de verdad es el
 * timestamp de inicio (design D4): el intervalo solo fuerza re-render, así el
 * tiempo es correcto aunque la pantalla se bloquee o la pestaña duerma.
 */
export default function BrewTimer({ method, totalWaterG, onRegister }: Props) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [stoppedAt, setStoppedAt] = useState<number | null>(null)
  // `now` vive en estado para mantener el render puro; el intervalo lo refresca
  const [now, setNow] = useState(0)
  const running = startedAt !== null && stoppedAt === null

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [running])

  const elapsedS = startedAt === null ? 0 : (Math.max(stoppedAt ?? now, startedAt) - startedAt) / 1000
  const { min, max } = method.targetTimeS
  const inRange = elapsedS >= min && elapsedS <= max
  const overMax = elapsedS > max

  const phase = method.phases ? phaseAt(method.phases, elapsedS, totalWaterG) : null

  // aviso háptico al cambiar de fase (mejora progresiva)
  const lastPhase = useRef(-1)
  useEffect(() => {
    if (!running || !phase) return
    if (lastPhase.current !== -1 && phase.index !== lastPhase.current) {
      navigator.vibrate?.(200)
    }
    lastPhase.current = phase.index
  }, [running, phase])

  function reset() {
    setStartedAt(null)
    setStoppedAt(null)
    lastPhase.current = -1
  }

  const stateColor =
    startedAt === null ? 'text-ink' : overMax ? 'text-danger' : inRange ? 'text-leaf' : 'text-ink'

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <p className="uppercase text-xs text-copper">cronómetro</p>
        <p className="text-xs text-ink/60" data-numeric>
          objetivo {formatTime(min)}–{formatTime(max)}
        </p>
      </div>

      <p
        data-numeric
        className={`mt-2 text-center font-display text-6xl ${stateColor} ${inRange && running ? 'pulse-soft' : ''}`}
      >
        {formatTime(elapsedS)}
      </p>

      {running && phase && (
        <div className="mt-3 rounded-lg bg-crema/50 px-3 py-2 text-center">
          <p className="font-semibold">
            {phase.finished ? '✓ Vertidos completados' : phase.name}
          </p>
          {!phase.finished && (
            <p className="mt-0.5 text-sm text-ink/70" data-numeric>
              {Math.ceil(phase.remainingInPhaseS)} s
              {phase.waterTargetG !== null && <> · hasta {phase.waterTargetG} g en báscula</>}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {startedAt === null ? (
          <button
            onClick={() => {
              const t = Date.now()
              setStartedAt(t)
              setNow(t)
            }}
            className="press flex-1 rounded-xl bg-caramel py-3 text-lg font-semibold text-white"
          >
            ▶ Empezar
          </button>
        ) : running ? (
          <button
            onClick={() => setStoppedAt(Date.now())}
            className="press flex-1 rounded-xl bg-ink py-3 text-lg font-semibold text-white"
          >
            ⏹ Parar
          </button>
        ) : (
          <>
            <button
              onClick={reset}
              className="press rounded-xl border hairline px-4 py-3 font-semibold"
            >
              ↺
            </button>
            <button
              onClick={() => onRegister(Math.round(elapsedS))}
              className="press flex-1 rounded-xl bg-leaf py-3 font-semibold text-white"
            >
              Registrar extracción
            </button>
          </>
        )}
      </div>
    </div>
  )
}
