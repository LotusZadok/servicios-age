import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { sortRequestsFirst } from '@/lib/maintenances'
import { StatusBadge } from '@/components/status-badge'
import { TableScroll } from '@/components/table-scroll'
import { formatColones, orDash } from '@/lib/format'
import { deleteMaintenance } from './actions'

export default async function MaintenancesPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('*, machines(name), locations(name), technician:profiles!technician_id(full_name)')
    .order('created_at', { ascending: false })

  const ordered = sortRequestsFirst(maintenances ?? [])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mantenimientos</h1>
        <Link href="/dashboard/maintenances/new" className="btn btn-primary">
          Nuevo mantenimiento
        </Link>
      </div>
      {ordered.length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin mantenimientos</span>
          <span className="empty-hint">
            Registra uno con “Nuevo mantenimiento”, o espera a que un cliente solicite servicio.
          </span>
        </div>
      ) : (
      <TableScroll>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Máquina</th>
            <th>Sede</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Técnico</th>
            <th className="num">Horímetro</th>
            <th className="num">Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ordered.map((m) => (
            <tr key={m.id}>
              <td><span className="mono">{orDash(m.date)}</span></td>
              <td>{orDash(m.machines?.name)}</td>
              <td>{orDash(m.locations?.name)}</td>
              <td>{m.description}</td>
              <td>{m.is_corrective ? 'Correctivo' : 'Preventivo'}</td>
              <td><StatusBadge status={m.status} /></td>
              <td>{orDash(m.technician?.full_name)}</td>
              <td className="num"><span className="mono">{orDash(m.hour_meter)}</span></td>
              <td className="num"><span className="mono">{formatColones(m.cost_total)}</span></td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td>
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/maintenances/${m.id}/edit`} className="link-edit">
                    Editar
                  </Link>
                  {canDelete(profile.role) && (
                    <form action={deleteMaintenance.bind(null, m.id)}>
                      <button type="submit" className="link-danger">
                        Eliminar
                      </button>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </TableScroll>
      )}
    </div>
  )
}
