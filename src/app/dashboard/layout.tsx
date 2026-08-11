import { requireStaff } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { logout } from './actions'
import { NavLink } from './nav-link'
import { NavMenu } from './nav-menu'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireStaff()
  const supabase = await createClient()
  const { count } = await supabase
    .from('maintenances')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'solicitado')
  const pending = count ?? 0
  const maintenancesLabel = pending > 0 ? `Mantenimientos (${pending})` : 'Mantenimientos'

  return (
    <div className="min-h-screen">
      <header className="app-nav">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <span className="brand order-1 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" aria-hidden="true" className="brand-mark" />
            Servicios AGE
          </span>

          {/* NavMenu aporta el botón (order-2) y el panel de links (order-4 en
              móvil, order-2 en md), así que el orden visual queda:
              móvil   → marca · botón · salir / panel debajo
              md y +  → marca · links · salir */}
          <NavMenu>
            <NavLink href="/dashboard/clients">Clientes</NavLink>
            <NavLink href="/dashboard/machines">Máquinas</NavLink>
            <NavLink href="/dashboard/maintenances">{maintenancesLabel}</NavLink>
            <NavLink href="/dashboard/brands">Marcas</NavLink>
            <NavLink href="/dashboard/machine-types">Tipos</NavLink>
            <NavLink href="/dashboard/reports">Reportes</NavLink>
            {canManageUsers(profile.role) && (
              <NavLink href="/dashboard/users">Usuarios</NavLink>
            )}
          </NavMenu>

          {/* En móvil el ml-auto lo pone el botón de menú; duplicarlo acá haría
              que ambos se repartieran el espacio libre y abriría un hueco. */}
          <form action={logout} className="order-3 flex items-center gap-3 md:ml-auto">
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
