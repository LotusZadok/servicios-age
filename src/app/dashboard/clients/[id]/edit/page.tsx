import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateClientRecord } from '../../actions'

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()

  if (!client) {
    notFound()
  }

  const updateClientWithId = updateClientRecord.bind(null, id)

  return (
    <form action={updateClientWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar cliente</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={client.name}
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={client.email ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={client.phone ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
