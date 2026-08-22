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
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" required className="field" />
      </div>
      <div>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" className="field" />
      </div>
      <div>
        <label htmlFor="phone">Teléfono</label>
        <input id="phone" name="phone" className="field" />
      </div>
      <div>
        <label htmlFor="address">Dirección</label>
        <input id="address" name="address" className="field" />
      </div>
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
