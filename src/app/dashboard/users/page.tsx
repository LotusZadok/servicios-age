import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TableScroll } from '@/components/table-scroll'
import { updateUserRole } from './actions'
import { DeleteUserButton } from './delete-user-button'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { user } = await requireAdmin()
  const { error } = await searchParams
  const supabase = await createClient()
  // Sólo cuentas internas. Un perfil con `client_id` es el acceso al portal de
  // un cliente y se gestiona desde la ficha de ese cliente: listarlo aquí, con
  // un selector que sólo ofrece admin y empleado, invitaba a convertirlo en
  // personal de un clic.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .is('client_id', null)
    .order('full_name')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <Link
          href="/dashboard/users/new"
          className="btn btn-primary"
        >
          Nuevo usuario
        </Link>
      </div>
      {error && <p className="mb-4 text-sm link-danger">{error}</p>}
      <p className="mb-4 text-sm text-[var(--muted)]">
        Sólo cuentas internas. Los accesos al portal de los clientes se gestionan
        desde la ficha de cada cliente.
      </p>
      <TableScroll>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Rol</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(profiles ?? []).map((p) => (
            <tr key={p.id}>
              <td>{p.full_name}</td>
              <td>{p.role}</td>
              <td>
                <div className="flex items-center gap-3">
                  <form action={updateUserRole.bind(null, p.id)} className="flex items-center gap-2">
                    <select name="role" defaultValue={p.role} className="rounded border px-2 py-1">
                      <option value="admin">admin</option>
                      <option value="empleado">empleado</option>
                    </select>
                    <button type="submit" className="link-edit">
                      Guardar
                    </button>
                  </form>
                  {p.id !== user.id && <DeleteUserButton id={p.id} fullName={p.full_name} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </TableScroll>
    </div>
  )
}
