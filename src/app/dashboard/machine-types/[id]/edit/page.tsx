import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateMachineType } from '../../actions'

export default async function EditMachineTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: type } = await supabase.from('machine_types').select('*').eq('id', id).single()

  if (!type) {
    notFound()
  }

  const updateMachineTypeWithId = updateMachineType.bind(null, id)

  return (
    <form action={updateMachineTypeWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar tipo</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={type.name}
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Descripción
        </label>
        <input
          id="description"
          name="description"
          defaultValue={type.description ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
