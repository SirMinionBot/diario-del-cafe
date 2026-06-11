// Cola de escrituras offline (spec offline-sync, design D1): solo inserts de
// brews, con UUID generado en cliente. IndexedDB nativo; la lógica de
// sincronización es agnóstica del almacén (QueueStore) para ser testeable.

export type PendingBrew = {
  /** UUID de cliente: será la PK del brew en Supabase (idempotencia) */
  id: string
  payload: Record<string, unknown>
  queuedAt: string
}

export interface QueueStore {
  add(entry: PendingBrew): Promise<void>
  all(): Promise<PendingBrew[]>
  remove(id: string): Promise<void>
}

/** Almacén en memoria para tests y como referencia del contrato. */
export function memoryQueue(): QueueStore {
  const items = new Map<string, PendingBrew>()
  return {
    add: async (e) => void items.set(e.id, e),
    all: async () => [...items.values()],
    remove: async (id) => void items.delete(id),
  }
}

const DB_NAME = 'diario-del-cafe'
const STORE = 'pending-brews'

/** Abre la cola sobre IndexedDB; null si no está disponible (degradación, spec). */
export function openBrewQueue(): Promise<QueueStore | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onerror = () => resolve(null)
    req.onsuccess = () => {
      const db = req.result
      const tx = (mode: IDBTransactionMode) => db.transaction(STORE, mode).objectStore(STORE)
      const run = <T>(r: IDBRequest<T>) =>
        new Promise<T>((res, rej) => {
          r.onsuccess = () => res(r.result)
          r.onerror = () => rej(r.error)
        })
      resolve({
        add: async (e) => void (await run(tx('readwrite').put(e))),
        all: () => run(tx('readonly').getAll()) as Promise<PendingBrew[]>,
        remove: async (id) => void (await run(tx('readwrite').delete(id))),
      })
    }
  })
}

export type InsertResult = { ok: true } | { ok: false; duplicate: boolean }

/**
 * Reintenta los inserts pendientes. Un duplicado (la PK ya existe en el
 * servidor: reintento tras éxito no confirmado) cuenta como sincronizado.
 */
export async function syncPending(
  store: QueueStore,
  insert: (entry: PendingBrew) => Promise<InsertResult>,
): Promise<{ synced: number; failed: number }> {
  let synced = 0
  let failed = 0
  for (const entry of await store.all()) {
    const result = await insert(entry)
    if (result.ok || result.duplicate) {
      await store.remove(entry.id)
      synced++
    } else {
      failed++
    }
  }
  return { synced, failed }
}
