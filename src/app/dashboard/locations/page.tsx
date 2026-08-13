import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { TableScroll } from '@/components/table-scroll'
import { deleteLocation } from './actions'

export default async function LocationsPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('*, clients(name)')
    .eq('active', true)
    .order('name')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sedes</h1>
        <Link href="/dashboard/locations/new" className="btn btn-primary">
          Nueva sede
        </Link>
      </div>
      {(locations ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin sedes</span>
          <span className="empty-hint">Crea la primera con “Nueva sede”.</span>
        </div>
      ) : (
      <TableScroll>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cliente</th>
            <th>Dirección</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(locations ?? []).map((location) => (
            <tr key={location.id}>
              <td>{location.name}</td>
              <td>{location.clients?.name}</td>
              <td>{location.address}</td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td>
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/locations/${location.id}/edit`} className="link-edit">
                    Editar
                  </Link>
                  {canDelete(profile.role) && (
                    <form action={deleteLocation.bind(null, location.id)}>
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
