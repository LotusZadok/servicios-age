import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { TableScroll } from '@/components/table-scroll'
import { deleteBrand } from './actions'

export default async function BrandsPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Marcas</h1>
        <Link
          href="/dashboard/brands/new"
          className="btn btn-primary"
        >
          Nueva marca
        </Link>
      </div>
      {(brands ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin marcas</span>
          <span className="empty-hint">Crea la primera con “Nueva marca”.</span>
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
          {(brands ?? []).map((brand) => (
            <tr key={brand.id}>
              <td>{brand.name}</td>
              <td>{brand.description}</td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td>
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/brands/${brand.id}/edit`} className="link-edit">
                    Editar
                  </Link>
                  {canDelete(profile.role) && (
                    <form action={deleteBrand.bind(null, brand.id)}>
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
