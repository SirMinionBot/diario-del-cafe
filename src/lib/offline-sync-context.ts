import { createContext } from 'react'

export type OfflineSyncState = {
  /** extracciones encoladas a la espera de red */
  pendingCount: number
  /** avisar de que se encoló algo nuevo (refresca contador e intenta sync) */
  notifyQueued: () => void
}

export const OfflineSyncContext = createContext<OfflineSyncState>({
  pendingCount: 0,
  notifyQueued: () => {},
})
