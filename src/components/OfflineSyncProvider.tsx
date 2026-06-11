import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase.ts'
import { OfflineSyncContext } from '../lib/offline-sync-context.ts'
import { openBrewQueue, syncPending, type PendingBrew } from '../lib/offlineQueue.ts'

/** Insert idempotente: el conflicto de PK (23505) = ya sincronizado (design D1). */
async function insertPending(entry: PendingBrew) {
  const { error } = await supabase.from('brews').insert({ ...entry.payload, id: entry.id })
  if (!error) return { ok: true as const }
  return { ok: false as const, duplicate: error.code === '23505' }
}

/** Sincroniza la cola y devuelve cuántas quedan pendientes. */
async function syncAndCount(): Promise<number> {
  const queue = await openBrewQueue()
  if (!queue) return 0
  if (navigator.onLine) await syncPending(queue, insertPending)
  return (await queue.all()).length
}

export default function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0)

  const notifyQueued = useCallback(() => {
    void syncAndCount().then(setPendingCount)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = () => {
      void syncAndCount().then((n) => {
        if (!cancelled) setPendingCount(n)
      })
    }
    run() // al arrancar la app (spec offline-sync)
    window.addEventListener('online', run)
    return () => {
      cancelled = true
      window.removeEventListener('online', run)
    }
  }, [])

  return (
    <OfflineSyncContext.Provider value={{ pendingCount, notifyQueued }}>
      {children}
    </OfflineSyncContext.Provider>
  )
}
