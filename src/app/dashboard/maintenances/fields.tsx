import { createClient } from '@/lib/supabase/server'
import { CostFields } from './cost-fields'
import { MachineLocationSelect } from './machine-location-select'

type MaintenanceDefaults = {
  machine_id?: string
  location_id?: string | null
  technician_id?: string | null
  date?: string | null
  description?: string
  is_corrective?: boolean
  cost_subtotal?: number | null
  tax_amount?: number | null
  hour_meter?: number | null
  report_ref?: string | null
  quote_ref?: string | null
  status?: string
}

export async function MaintenanceFields({ defaults }: { defaults?: MaintenanceDefaults }) {
  const supabase = await createClient()

  // La sede ya guardada se incluye aunque esté archivada: es la instantánea
  // del trabajo y no se puede perder al editar cualquier otro campo.
  const locationsQuery = supabase.from('locations').select('id, name, client_id, active')
  const [{ data: machines }, { data: staff }, { data: locations }] = await Promise.all([
    supabase
      .from('machines')
      .select('id, name, client_id, location_id')
      .eq('active', true)
      .order('name'),
    supabase.from('profiles').select('id, full_name, role').order('full_name'),
    (defaults?.location_id
      ? locationsQuery.or(`active.eq.true,id.eq.${defaults.location_id}`)
      : locationsQuery.eq('active', true)
    ).order('name'),
  ])
  const technicians = (staff ?? []).filter((p) => p.role === 'admin' || p.role === 'empleado')

  return (
    <>
      <MachineLocationSelect
        machines={machines ?? []}
        locations={locations ?? []}
        defaultMachineId={defaults?.machine_id}
        defaultLocationId={defaults?.location_id}
      />
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
        <label htmlFor="hour_meter" className="block text-sm font-medium">Horímetro</label>
        <input id="hour_meter" name="hour_meter" type="number" step="1" min="0" defaultValue={defaults?.hour_meter ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
        <p className="mt-1 text-xs text-[var(--muted)]">Lectura tomada en la visita, en horas.</p>
      </div>
      <CostFields
        defaultSubtotal={defaults?.cost_subtotal}
        defaultTax={defaults?.tax_amount}
      />
      <div>
        <label htmlFor="report_ref" className="block text-sm font-medium">N.º de boleta o reporte</label>
        <input id="report_ref" name="report_ref" defaultValue={defaults?.report_ref ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="quote_ref" className="block text-sm font-medium">N.º de proforma</label>
        <input id="quote_ref" name="quote_ref" defaultValue={defaults?.quote_ref ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
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
