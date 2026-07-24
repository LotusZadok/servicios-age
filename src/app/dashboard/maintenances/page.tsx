import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { sortRequestsFirst } from '@/lib/maintenances'
import { StatusBadge } from '@/components/status-badge'
import { deleteMaintenance } from './actions'

export default async function MaintenancesPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('*, machines(name), technician:profiles!technician_id(full_name)')
    .order('created_at', { ascending: false })

  const ordered = sortRequestsFirst(maintenances ?? [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
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
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Fecha</th>
            <th className="p-2">Máquina</th>
            <th className="p-2">Descripción</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Técnico</th>
            <th className="p-2 num">Costo</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {ordered.map((m) => (
            <tr key={m.id} className="border-b text-sm">
              <td className="p-2"><span className="mono">{m.date ?? '—'}</span></td>
              <td className="p-2">{m.machines?.name}</td>
              <td className="p-2">{m.description}</td>
              <td className="p-2">{m.is_corrective ? 'Correctivo' : 'Preventivo'}</td>
              <td className="p-2"><StatusBadge status={m.status} /></td>
              <td className="p-2">{m.technician?.full_name}</td>
              <td className="p-2 num"><span className="mono">{m.cost ?? ''}</span></td>
              <td className="flex gap-3 p-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
