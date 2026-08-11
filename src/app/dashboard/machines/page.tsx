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
    .select('*, brands(name), machine_types(name), clients(name)')
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
      <table className="min-w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Serie</th>
            <th className="p-2">Modelo</th>
            <th className="p-2">Marca</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Cliente</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {(machines ?? []).map((machine) => (
            <tr key={machine.id} className="border-b text-sm">
              <td className="p-2">{machine.name}</td>
              <td className="p-2"><span className="mono">{machine.serial_number}</span></td>
              <td className="p-2"><span className="mono">{machine.model}</span></td>
              <td className="p-2">{machine.brands?.name}</td>
              <td className="p-2">{machine.machine_types?.name}</td>
              <td className="p-2">{machine.clients?.name}</td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td className="p-2">
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
