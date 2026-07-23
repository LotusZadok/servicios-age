import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { deleteMachine } from './actions'

export default async function MachinesPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: machines } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name)')
    .order('name')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Máquinas</h1>
        <Link
          href="/dashboard/machines/new"
          className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
        >
          Nueva máquina
        </Link>
      </div>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Serie</th>
            <th className="p-2">Marca</th>
            <th className="p-2">Tipo</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {(machines ?? []).map((machine) => (
            <tr key={machine.id} className="border-b text-sm">
              <td className="p-2">{machine.name}</td>
              <td className="p-2">{machine.serial_number}</td>
              <td className="p-2">{machine.brands?.name}</td>
              <td className="p-2">{machine.machine_types?.name}</td>
              <td className="flex gap-3 p-2">
                <Link href={`/dashboard/machines/${machine.id}/edit`} className="text-blue-600">
                  Editar
                </Link>
                {canDelete(profile.role) && (
                  <form action={deleteMachine.bind(null, machine.id)}>
                    <button type="submit" className="text-red-600">
                      Eliminar
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
