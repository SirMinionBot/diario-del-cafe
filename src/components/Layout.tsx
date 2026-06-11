import { NavLink, Outlet } from 'react-router-dom'

const SECTIONS = [
  { to: '/', label: 'Preparar', icon: '☕' },
  { to: '/cafes', label: 'Cafés', icon: '🫘' },
  { to: '/diario', label: 'Diario', icon: '📓' },
  { to: '/perfil', label: 'Perfil', icon: '📈' },
] as const

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>
      {/* navegación inferior fija: 4 secciones, alcanzable con el pulgar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t hairline bg-card pb-[env(safe-area-inset-bottom)]">
        <ul className="flex">
          {SECTIONS.map(({ to, label, icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `press flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                    isActive ? 'text-copper' : 'text-ink/55'
                  }`
                }
              >
                <span aria-hidden className="text-lg leading-none">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
