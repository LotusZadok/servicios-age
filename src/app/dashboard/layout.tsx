import { requireStaff } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { logout } from './actions'
import { NavLink } from './nav-link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireStaff()

  return (
    <div className="min-h-screen">
      <header className="app-nav">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <span className="brand shrink-0">
            <span className="brand-mark">AG</span>
            AGServicios
          </span>

          <nav className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 sm:order-none sm:w-auto sm:border-0 sm:pt-0">
            <NavLink href="/dashboard/clients">Clientes</NavLink>
            <NavLink href="/dashboard/machines">Máquinas</NavLink>
            <NavLink href="/dashboard/maintenances">Mantenimientos</NavLink>
            <NavLink href="/dashboard/brands">Marcas</NavLink>
            <NavLink href="/dashboard/machine-types">Tipos</NavLink>
            <NavLink href="/dashboard/reports">Reportes</NavLink>
            {canManageUsers(profile.role) && (
              <NavLink href="/dashboard/users">Usuarios</NavLink>
            )}
          </nav>

          <form action={logout} className="ml-auto flex items-center gap-3">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-medium">{profile.full_name}</span>
              <span className="eyebrow">{profile.role}</span>
            </span>
            <button type="submit" className="btn btn-ghost">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
