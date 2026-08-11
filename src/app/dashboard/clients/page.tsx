import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { TableScroll } from '@/components/table-scroll'
import { deleteClientRecord } from './actions'

export default async function ClientsPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Link
          href="/dashboard/clients/new"
          className="btn btn-primary"
        >
          Nuevo cliente
        </Link>
      </div>
      {(clients ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin clientes</span>
          <span className="empty-hint">Crea el primero con “Nuevo cliente”.</span>
        </div>
      ) : (
      <TableScroll>
      <table className="min-w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Correo</th>
            <th className="p-2">Teléfono</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {(clients ?? []).map((client) => (
            <tr key={client.id} className="border-b text-sm">
              <td className="p-2">{client.name}</td>
              <td className="p-2">{client.email}</td>
              <td className="p-2">{client.phone}</td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td className="p-2">
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/clients/${client.id}/edit`} className="link-edit">
                    Editar
                  </Link>
                  {canDelete(profile.role) && (
                    <form action={deleteClientRecord.bind(null, client.id)}>
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
