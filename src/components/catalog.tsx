import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { CATALOGS, type CatalogKey } from '@/lib/catalog'
import { TableScroll } from '@/components/table-scroll'
import { saveCatalogItem, archiveCatalogItem } from '@/app/dashboard/catalog-actions'

/** Listado de un catálogo simple (nombre + descripción, baja lógica). */
export async function CatalogList({ tipo }: { tipo: CatalogKey }) {
  const c = CATALOGS[tipo]
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase.from(c.tabla).select('*').eq('active', true).order('name')
  const items = data ?? []

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{c.titulo}</h1>
        <Link href={`${c.ruta}/new`} className="btn btn-primary">
          {c.nuevo}
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <span className="empty-title">{c.vacio}</span>
          <span className="empty-hint">{c.pista}</span>
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
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.description}</td>
                  {/* El flex va en un div interno: sobre el propio <td>, display:flex
                      le quita el rol de celda. */}
                  <td>
                    <div className="flex items-center gap-3">
                      <Link href={`${c.ruta}/${item.id}/edit`} className="link-edit">
                        Editar
                      </Link>
                      {canDelete(profile.role) && (
                        <form action={archiveCatalogItem.bind(null, tipo, item.id)}>
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

/** Alta y edición del mismo catálogo. Sin `id` es alta. */
export async function CatalogForm({
  tipo,
  id,
  error,
}: {
  tipo: CatalogKey
  id?: string
  error?: string
}) {
  const c = CATALOGS[tipo]
  let item: { name: string; description: string | null } | null = null

  if (id) {
    const supabase = await createClient()
    const { data } = await supabase.from(c.tabla).select('*').eq('id', id).single()
    if (!data) notFound()
    item = data
  }

  return (
    <form action={saveCatalogItem.bind(null, tipo, id ?? null)} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">{id ? c.editar : c.nuevo}</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <div>
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" required defaultValue={item?.name ?? ''} className="field" />
      </div>
      <div>
        <label htmlFor="description">Descripción</label>
        <input
          id="description"
          name="description"
          defaultValue={item?.description ?? ''}
          className="field"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
