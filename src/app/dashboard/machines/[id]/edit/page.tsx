import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateMachine } from '../../actions'

export default async function EditMachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const [{ data: machine }, { data: brands }, { data: types }] = await Promise.all([
    supabase.from('machines').select('*').eq('id', id).single(),
    supabase.from('brands').select('*').order('name'),
    supabase.from('machine_types').select('*').order('name'),
  ])

  if (!machine) {
    notFound()
  }

  const updateMachineWithId = updateMachine.bind(null, id)

  return (
    <form action={updateMachineWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar máquina</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={machine.name}
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="serial_number" className="block text-sm font-medium">
          Número de serie
        </label>
        <input
          id="serial_number"
          name="serial_number"
          defaultValue={machine.serial_number ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="brand_id" className="block text-sm font-medium">
          Marca
        </label>
        <select
          id="brand_id"
          name="brand_id"
          required
          defaultValue={machine.brand_id}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          {(brands ?? []).map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="type_id" className="block text-sm font-medium">
          Tipo
        </label>
        <select
          id="type_id"
          name="type_id"
          required
          defaultValue={machine.type_id}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          {(types ?? []).map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="rounded bg-gray-900 px-3 py-2 text-sm text-white">
        Guardar
      </button>
    </form>
  )
}
