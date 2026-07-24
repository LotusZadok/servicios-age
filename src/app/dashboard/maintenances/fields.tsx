import { createClient } from '@/lib/supabase/server'

type MaintenanceDefaults = {
  machine_id?: string
  technician_id?: string | null
  date?: string | null
  description?: string
  is_corrective?: boolean
  cost?: number | null
  status?: string
}

export async function MaintenanceFields({ defaults }: { defaults?: MaintenanceDefaults }) {
  const supabase = await createClient()
  const [{ data: machines }, { data: staff }] = await Promise.all([
    supabase.from('machines').select('id, name').eq('active', true).order('name'),
    supabase.from('profiles').select('id, full_name, role').order('full_name'),
  ])
  const technicians = (staff ?? []).filter((p) => p.role === 'admin' || p.role === 'empleado')

  return (
    <>
      <div>
        <label htmlFor="machine_id" className="block text-sm font-medium">Máquina</label>
        <select id="machine_id" name="machine_id" required defaultValue={defaults?.machine_id ?? ''} className="mt-1 w-full rounded border px-3 py-2">
          <option value="" disabled>— Selecciona —</option>
          {(machines ?? []).map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="technician_id" className="block text-sm font-medium">Técnico responsable</label>
        <select id="technician_id" name="technician_id" defaultValue={defaults?.technician_id ?? ''} className="mt-1 w-full rounded border px-3 py-2">
          <option value="">— Sin asignar —</option>
          {technicians.map((t) => (<option key={t.id} value={t.id}>{t.full_name}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium">Fecha</label>
        <input id="date" name="date" type="date" defaultValue={defaults?.date ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium">Estado</label>
        <select id="status" name="status" defaultValue={defaults?.status ?? 'programado'} className="mt-1 w-full rounded border px-3 py-2">
          <option value="solicitado">Solicitado</option>
          <option value="programado">Programado</option>
          <option value="en_proceso">En proceso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div>
        <label htmlFor="cost" className="block text-sm font-medium">Costo</label>
        <input id="cost" name="cost" type="number" step="0.01" defaultValue={defaults?.cost ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_corrective" defaultChecked={defaults?.is_corrective ?? false} />
        Correctivo (si se desmarca, es preventivo)
      </label>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Descripción</label>
        <textarea id="description" name="description" required rows={3} defaultValue={defaults?.description ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
    </>
  )
}
