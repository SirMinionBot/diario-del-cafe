import { useContext } from 'react'
import { OfflineSyncContext } from '../lib/offline-sync-context.ts'

export function useOfflineSync() {
  return useContext(OfflineSyncContext)
}
