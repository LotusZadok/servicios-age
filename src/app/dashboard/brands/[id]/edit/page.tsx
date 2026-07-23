import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateBrand } from '../../actions'

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: brand } = await supabase.from('brands').select('*').eq('id', id).single()

  if (!brand) {
    notFound()
  }

  const updateBrandWithId = updateBrand.bind(null, id)

  return (
    <form action={updateBrandWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar marca</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={brand.name}
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <button type="submit" className="rounded bg-gray-900 px-3 py-2 text-sm text-white">
        Guardar
      </button>
    </form>
  )
}
