import { notFound } from 'next/navigation'
import { requireClient } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function PortalMachinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    .order('date', { ascending: false })

  return (
    <div>
      <p className="eyebrow">Máquina</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{machine.name}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {machine.brands?.name} · {machine.machine_types?.name}
        {machine.model ? ` · ${machine.model}` : ''}
        {machine.serial_number ? ` · Serie ${machine.serial_number}` : ''}
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">Historial de mantenimientos</h2>
      <table className="w-full border-collapse bg-white">
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
              <td className="p-2"><span className="mono">{m.date}</span></td>
              <td className="p-2">{m.is_corrective ? 'Correctivo' : 'Preventivo'}</td>
              <td className="p-2">{m.status}</td>
              <td className="p-2">{m.description}</td>
            </tr>
          ))}
          {(maintenances ?? []).length === 0 && (
            <tr><td className="p-2 text-sm text-[var(--muted)]" colSpan={4}>Sin mantenimientos registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
