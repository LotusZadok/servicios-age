import { createMaintenance } from '../actions'
import { MaintenanceFields } from '../fields'

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <form action={createMaintenance} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo mantenimiento</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <MaintenanceFields />
      <button type="submit" className="btn btn-primary">Guardar</button>
    </form>
  )
}
