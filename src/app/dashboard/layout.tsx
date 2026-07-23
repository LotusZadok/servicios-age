import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { logout } from './actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard/clients">Clientes</Link>
          <Link href="/dashboard/machines">Máquinas</Link>
          <Link href="/dashboard/brands">Marcas</Link>
          <Link href="/dashboard/machine-types">Tipos</Link>
          <Link href="/dashboard/reports">Reportes</Link>
          {canManageUsers(profile.role) && (
            <Link href="/dashboard/users">Usuarios</Link>
          )}
        </div>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span>
            {profile.full_name} ({profile.role})
          </span>
          <button type="submit" className="text-gray-500 underline">
            Salir
          </button>
        </form>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
