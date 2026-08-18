import { requireStaff } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { logout } from './actions'
import { NavLink } from './nav-link'

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

  return (
    <div className="min-h-screen">
      <header className="app-nav">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 sm:px-6">
          <span className="brand shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" aria-hidden="true" className="brand-mark" />
            Servicios AGE
          </span>

          {/* Un solo `ml-auto`, sobre el grupo. Repartirlo entre la identidad y
              el formulario haría que ambos reclamaran el espacio libre y se
              abriría un hueco entre los dos. */}
          <div className="ml-auto flex items-center gap-3">
            {/* La identidad es hermana del formulario, no hija: estaba dentro
                sólo para que el `ml-auto` la arrastrara junto al botón, y eso
                dejaba nombre y rol envueltos en un submit que no los usa. */}
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-medium">{profile.full_name}</span>
              <span className="eyebrow">{profile.role}</span>
            </span>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost">
                Salir
              </button>
            </form>
          </div>
        </div>

        {/* El contenedor va a sangre por fuera y alineado a max-w-6xl por
            dentro: es lo que deja que las pestañas se desplacen por debajo del
            borde de la pantalla en móvil sin desalinearse del <main> en
            escritorio. */}
        <div className="app-nav-tabs">
          <nav className="mx-auto flex max-w-6xl items-stretch gap-x-5 px-4 sm:px-6">
            <NavLink
              href="/dashboard/maintenances"
              count={pending}
              label={
                pending > 0
                  ? `Mantenimientos, ${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`
                  : undefined
              }
            >
              Mantenimientos
            </NavLink>
            <NavLink href="/dashboard/clients">Clientes</NavLink>
            <NavLink href="/dashboard/locations">Sedes</NavLink>
            <NavLink href="/dashboard/machines">Máquinas</NavLink>

            <span aria-hidden="true" className="nav-sep" />

            <NavLink href="/dashboard/brands">Marcas</NavLink>
            <NavLink href="/dashboard/machine-types">Tipos</NavLink>
            <NavLink href="/dashboard/reports">Reportes</NavLink>
            {canManageUsers(profile.role) && (
              <NavLink href="/dashboard/users">Usuarios</NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
