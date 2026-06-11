import { useContext } from 'react'
import { AuthContext } from '../lib/auth-context.ts'

export function useAuth() {
  return useContext(AuthContext)
}
