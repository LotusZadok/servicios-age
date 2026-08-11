import { notFound } from 'next/navigation'
import { requireClient } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/status-badge'
import { TableScroll } from '@/components/table-scroll'
import { requestMaintenance } from './actions'

export default async function PortalMachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const { profile } = await requireClient()
  const supabase = await createClient()

  // RLS already restricts to the client's own machines; the explicit client_id
  // filter is defense in depth.
  const { data: machine } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name)')
    .eq('id', id)
    .eq('client_id', profile.client_id ?? '')
    .eq('active', true)
    .maybeSingle()

  if (!machine) {
    notFound()
  }

  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('*')
    .eq('machine_id', id)
    .order('created_at', { ascending: false })

  const requestForMachine = requestMaintenance.bind(null, id)

  return (
    <div>
      <p className="eyebrow">Máquina</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{machine.name}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {machine.brands?.name} · {machine.machine_types?.name}
        {machine.model ? ` · ${machine.model}` : ''}
        {machine.serial_number ? ` · Serie ${machine.serial_number}` : ''}
      </p>

      <section className="card mt-6 max-w-md p-5">
        <h2 className="text-lg font-semibold">Solicitar mantenimiento</h2>
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
        <form action={requestForMachine} className="mt-3 space-y-3">
          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              ¿Qué necesita?
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <button type="submit" className="btn btn-primary">Enviar solicitud</button>
        </form>
      </section>

      <h2 className="mb-3 mt-8 text-xl font-semibold">Historial de mantenimientos</h2>
      {(maintenances ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin mantenimientos registrados</span>
          <span className="empty-hint">
            Cuando solicites uno o el equipo agende un servicio, aparecerá aquí.
          </span>
        </div>
      ) : (
        <TableScroll>
        <table className="min-w-full border-collapse bg-white">
          <thead>
            <tr className="border-b text-left text-sm">
              <th className="p-2">Fecha</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {(maintenances ?? []).map((m) => (
              <tr key={m.id} className="border-b text-sm">
                <td className="p-2"><span className="mono">{m.date ?? '—'}</span></td>
                <td className="p-2">{m.is_corrective ? 'Correctivo' : 'Preventivo'}</td>
                <td className="p-2"><StatusBadge status={m.status} /></td>
                <td className="p-2">{m.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </TableScroll>
      )}
    </div>
  )
}
