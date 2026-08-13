import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { TableScroll } from '@/components/table-scroll'
import { deleteMachineType } from './actions'

export default async function MachineTypesPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: types } = await supabase
    .from('machine_types')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tipos de maquinaria</h1>
        <Link
          href="/dashboard/machine-types/new"
          className="btn btn-primary"
        >
          Nuevo tipo
        </Link>
      </div>
      {(types ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin tipos de maquinaria</span>
          <span className="empty-hint">Crea el primero con “Nuevo tipo”.</span>
        </div>
      ) : (
      <TableScroll>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(types ?? []).map((type) => (
            <tr key={type.id}>
              <td>{type.name}</td>
              <td>{type.description}</td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td>
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/machine-types/${type.id}/edit`} className="link-edit">
                    Editar
                  </Link>
                  {canDelete(profile.role) && (
                    <form action={deleteMachineType.bind(null, type.id)}>
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
