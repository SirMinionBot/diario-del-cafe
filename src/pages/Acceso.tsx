import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.ts'
import { useAuth } from '../hooks/useAuth.ts'

export default function Acceso() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  if (!loading && session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    setState(error ? 'error' : 'sent')
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="uppercase text-xs text-copper">cuaderno de barista</p>
      <h1 className="mt-1 text-4xl">Diario del Café</h1>
      <p className="mt-2 text-sm text-ink/70">
        Ratios, cronómetro y catas de tus cafés. Entra con tu email: te enviamos un enlace mágico.
      </p>

      {state === 'sent' ? (
        <div className="card mt-8 p-4 text-sm">
          ✉️ Enlace enviado a <strong>{email}</strong>. Ábrelo desde este dispositivo para entrar.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <input
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="card px-4 py-3 text-base outline-none focus:border-caramel"
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="press rounded-xl bg-caramel py-3 font-semibold text-white disabled:opacity-60"
          >
            {state === 'sending' ? 'Enviando…' : 'Enviar enlace mágico'}
          </button>
          {state === 'error' && (
            <p className="text-sm text-danger">No se pudo enviar el enlace. Inténtalo de nuevo.</p>
          )}
        </form>
      )}
    </div>
  )
}
