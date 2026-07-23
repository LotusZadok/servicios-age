import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { deleteMachineType } from './actions'

export default async function MachineTypesPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: types } = await supabase.from('machine_types').select('*').order('name')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tipos de maquinaria</h1>
        <Link
          href="/dashboard/machine-types/new"
          className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
        >
          Nuevo tipo
        </Link>
      </div>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {(types ?? []).map((type) => (
            <tr key={type.id} className="border-b text-sm">
              <td className="p-2">{type.name}</td>
              <td className="flex gap-3 p-2">
                <Link href={`/dashboard/machine-types/${type.id}/edit`} className="text-blue-600">
                  Editar
                </Link>
                {canDelete(profile.role) && (
                  <form action={deleteMachineType.bind(null, type.id)}>
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
