import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateMachine } from '../../actions'
import { MachineFields } from '../../fields'

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
  const { data: machine } = await supabase.from('machines').select('*').eq('id', id).single()

  if (!machine) {
    notFound()
  }

  const updateMachineWithId = updateMachine.bind(null, id)

  return (
    <form action={updateMachineWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar máquina</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <MachineFields
        defaults={{
          name: machine.name,
          serial_number: machine.serial_number,
          asset_number: machine.asset_number,
          model: machine.model,
          brand_id: machine.brand_id,
          type_id: machine.type_id,
          client_id: machine.client_id,
          location_id: machine.location_id,
        }}
      />
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
    </form>
  )
}
