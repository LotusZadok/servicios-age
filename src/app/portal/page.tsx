import Link from 'next/link'
import { requireClient } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function PortalHome() {
  const { profile } = await requireClient()
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', profile.client_id ?? '')
    .eq('active', true)
    .maybeSingle()

  const { data: machines } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name)')
    .eq('client_id', profile.client_id ?? '')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow">Mi información</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{client?.name}</h1>
        <div className="mt-3 text-sm text-[var(--muted)]">
          {client?.email && <p>Correo: {client.email}</p>}
          {client?.phone && <p>Teléfono: {client.phone}</p>}
          {client?.address && <p>Dirección: {client.address}</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Mis máquinas</h2>
        {(machines ?? []).length === 0 ? (
          <div className="empty">
            <span className="empty-title">Aún no tienes máquinas registradas</span>
            <span className="empty-hint">
              Cuando el equipo de AGServicios te asigne una, aparecerá aquí.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(machines ?? []).map((m) => (
              <Link
                key={m.id}
                href={`/portal/machines/${m.id}`}
                className="group card flex flex-col gap-3 p-5 transition-shadow hover:shadow-[var(--shadow)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-base font-semibold">{m.name}</span>
                  {m.serial_number && (
                    <span className="mono text-xs text-[var(--muted)]">{m.serial_number}</span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {m.brands?.name} · {m.machine_types?.name}
                  {m.model ? ` · ${m.model}` : ''}
                </p>
                <span className="mono mt-auto text-xs text-[var(--accent-ink)] transition-transform group-hover:translate-x-0.5">
                  Ver historial →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
