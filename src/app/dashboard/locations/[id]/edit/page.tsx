import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateLocation } from '../../actions'
import { LocationFields } from '../../fields'

export default async function EditLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: location } = await supabase.from('locations').select('*').eq('id', id).single()

  if (!location) {
    notFound()
  }

  const updateLocationWithId = updateLocation.bind(null, id)

  return (
    <form action={updateLocationWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar sede</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <LocationFields
        defaults={{
          client_id: location.client_id,
          name: location.name,
          address: location.address,
        }}
      />
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
