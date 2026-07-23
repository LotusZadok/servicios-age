import { createMachineType } from '../actions'

export default async function NewMachineTypePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <form action={createMachineType} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo tipo</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input id="name" name="name" required className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <button type="submit" className="rounded bg-gray-900 px-3 py-2 text-sm text-white">
        Guardar
      </button>
    </form>
  )
}
