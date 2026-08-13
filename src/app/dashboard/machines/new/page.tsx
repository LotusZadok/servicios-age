import { createMachine } from '../actions'
import { MachineFields } from '../fields'

export default async function NewMachinePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <form action={createMachine} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Nueva máquina</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <MachineFields />
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
