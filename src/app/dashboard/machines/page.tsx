import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { TableScroll } from '@/components/table-scroll'
import { deleteMachine } from './actions'

export default async function MachinesPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: machines } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name), clients(name), locations(name)')
    .eq('active', true)
    .order('name')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Máquinas</h1>
        <Link
          href="/dashboard/machines/new"
          className="btn btn-primary"
        >
          Nueva máquina
        </Link>
      </div>
      {(machines ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin máquinas</span>
          <span className="empty-hint">Crea la primera con “Nueva máquina”.</span>
        </div>
      ) : (
      <TableScroll>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Serie</th>
            <th>N.º activo</th>
            <th>Modelo</th>
            <th>Marca</th>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Sede</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(machines ?? []).map((machine) => (
            <tr key={machine.id}>
              <td>{machine.name}</td>
              <td><span className="mono">{machine.serial_number}</span></td>
              <td><span className="mono">{machine.asset_number}</span></td>
              <td><span className="mono">{machine.model}</span></td>
              <td>{machine.brands?.name}</td>
              <td>{machine.machine_types?.name}</td>
              <td>{machine.clients?.name}</td>
              <td>{machine.locations?.name}</td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td>
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/machines/${machine.id}/edit`} className="link-edit">
                    Editar
                  </Link>
                  {canDelete(profile.role) && (
                    <form action={deleteMachine.bind(null, machine.id)}>
                      <button type="submit" className="link-danger">
                        Archivar
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
