import { Navigate, Outlet, Routes, Route } from 'react-router-dom'
import AuthProvider from './components/AuthProvider.tsx'
import OfflineSyncProvider from './components/OfflineSyncProvider.tsx'
import Layout from './components/Layout.tsx'
import { useAuth } from './hooks/useAuth.ts'
import Acceso from './pages/Acceso.tsx'
import Preparar from './pages/Preparar.tsx'
import Referencias from './pages/Referencias.tsx'
import Cafes from './pages/Cafes.tsx'
import CafeDetalle from './pages/CafeDetalle.tsx'
import Diario from './pages/Diario.tsx'
import BrewNueva from './pages/BrewNueva.tsx'
import Comparar from './pages/Comparar.tsx'
import Perfil from './pages/Perfil.tsx'
import Molinillos from './pages/Molinillos.tsx'

function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return null // splash silencioso mientras se restaura la sesión
  if (!session) return <Navigate to="/acceso" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineSyncProvider>
      <Routes>
        <Route path="acceso" element={<Acceso />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Preparar />} />
            <Route path="referencias" element={<Referencias />} />
            <Route path="cafes" element={<Cafes />} />
            <Route path="cafes/:id" element={<CafeDetalle />} />
            <Route path="diario" element={<Diario />} />
            <Route path="diario/nueva" element={<BrewNueva />} />
            <Route path="diario/comparar" element={<Comparar />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="perfil/molinillos" element={<Molinillos />} />
          </Route>
        </Route>
      </Routes>
      </OfflineSyncProvider>
    </AuthProvider>
  )
}
