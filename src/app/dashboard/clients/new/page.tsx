import { createClientRecord } from '../actions'

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <form action={createClientRecord} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input id="name" name="name" required className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Correo
        </label>
        <input id="email" name="email" type="email" className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Teléfono
        </label>
        <input id="phone" name="phone" className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
