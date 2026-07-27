import Link from 'next/link'
import { requireUser } from '@/lib/auth'

const sections = [
  { href: '/dashboard/clients', label: 'Clientes', desc: 'Fichas y datos de contacto' },
  { href: '/dashboard/machines', label: 'Máquinas', desc: 'Inventario con marca y tipo' },
  { href: '/dashboard/brands', label: 'Marcas', desc: 'Catálogo de fabricantes' },
  { href: '/dashboard/machine-types', label: 'Tipos', desc: 'Categorías de maquinaria' },
  { href: '/dashboard/reports', label: 'Reportes', desc: 'Exportar catálogo en CSV' },
]

export default async function DashboardHome() {
  const { profile } = await requireUser()
  const firstName = profile.full_name.split(' ')[0]

  return (
    <div>
      <p className="eyebrow">Panel de control</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Hola, {firstName}
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Gestión de clientes, máquinas y catálogo de Servicios AGE.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="card group flex flex-col gap-1 p-5 transition-shadow hover:shadow-[var(--shadow)]"
          >
            <span className="flex items-center justify-between">
              <span className="text-base font-semibold">{s.label}</span>
              <span className="text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]">
                →
              </span>
            </span>
            <span className="text-sm text-[var(--muted)]">{s.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
