import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateMaintenance } from '../../actions'
import { MaintenanceFields } from '../../fields'

export default async function EditMaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: m } = await supabase.from('maintenances').select('*').eq('id', id).single()

  if (!m) {
    notFound()
  }

  const updateWithId = updateMaintenance.bind(null, id)

  return (
    <form action={updateWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar mantenimiento</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <MaintenanceFields
        defaults={{
          machine_id: m.machine_id,
          location_id: m.location_id,
          technician_id: m.technician_id,
          date: m.date,
          description: m.description,
          is_corrective: m.is_corrective,
          cost_subtotal: m.cost_subtotal,
          tax_amount: m.tax_amount,
          hour_meter: m.hour_meter,
          report_ref: m.report_ref,
          quote_ref: m.quote_ref,
          status: m.status,
        }}
      />
      <button type="submit" className="btn btn-primary">Guardar</button>
    </form>
  )
}
