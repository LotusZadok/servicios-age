import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Marcas</h1>
        <Link
          href="/dashboard/brands/new"
          className="btn btn-primary"
        >
          Nueva marca
        </Link>
      </div>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Descripción</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {(brands ?? []).map((brand) => (
            <tr key={brand.id} className="border-b text-sm">
              <td className="p-2">{brand.name}</td>
              <td className="p-2">{brand.description}</td>
              <td className="flex gap-3 p-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
