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
  const { data: profiles } = await supabase.from('profiles').select('*').order('full_name')

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
      <TableScroll>
      <table className="min-w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Rol</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {(profiles ?? []).map((p) => (
            <tr key={p.id} className="border-b text-sm">
              <td className="p-2">{p.full_name}</td>
              <td className="p-2">{p.role}</td>
              <td className="p-2">
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
