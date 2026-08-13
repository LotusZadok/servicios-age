import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { StatusBadge } from '@/components/status-badge'
import { orDash } from '@/lib/format'

export default async function DashboardHome() {
  const { profile } = await requireUser()
  const firstName = profile.full_name.split(' ')[0]
  const supabase = await createClient()

  const { count: solicitados } = await supabase
    .from('maintenances')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'solicitado')

  const { data: recientes } = await supabase
    .from('maintenances')
    .select('id, date, status, description, machines(name)')
    .order('created_at', { ascending: false })
    .limit(8)

  const pendientes = solicitados ?? 0

  return (
    <div>
      <p className="eyebrow">Panel de control</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Hola, {firstName}
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Operación de mantenimiento de Servicios AGE: máquinas, sedes y catálogo.
      </p>

      <Link
        href="/dashboard/maintenances"
        className="card mt-8 flex items-baseline gap-3 p-5"
      >
        <span className="text-3xl font-semibold tabular-nums">{pendientes}</span>
        <span className="text-[var(--muted)]">
          {pendientes === 1
            ? 'solicitud de servicio sin atender'
            : 'solicitudes de servicio sin atender'}
        </span>
      </Link>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Últimos movimientos</h2>
      {(recientes ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin mantenimientos</span>
          <span className="empty-hint">
            Registra uno desde “Mantenimientos”, o espera a que un cliente
            solicite servicio.
          </span>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Máquina</th>
              <th>Descripción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(recientes ?? []).map((m) => (
              <tr key={m.id}>
                <td><span className="mono">{orDash(m.date)}</span></td>
                <td>{orDash(m.machines?.name)}</td>
                <td>{m.description}</td>
                <td><StatusBadge status={m.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
