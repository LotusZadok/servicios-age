import { createLocation } from '../actions'
import { LocationFields } from '../fields'

export default async function NewLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <form action={createLocation} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Nueva sede</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <LocationFields />
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
