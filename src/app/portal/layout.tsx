import { requireClient } from '@/lib/auth'
import { logout } from '../dashboard/actions'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireClient()

  return (
    <div className="min-h-screen">
      <header className="app-nav">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="brand shrink-0">
            <span className="brand-mark">AG</span>
            Portal
          </span>
          <form action={logout} className="flex items-center gap-3">
            <span className="hidden text-sm font-medium sm:block">{profile.full_name}</span>
            <button type="submit" className="btn btn-ghost">Salir</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
