import { createClient } from '@/lib/supabase/server'

type LocationDefaults = {
  client_id?: string
  name?: string
  address?: string | null
}

export async function LocationFields({ defaults }: { defaults?: LocationDefaults }) {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <>
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium">
          Cliente
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          defaultValue={defaults?.client_id ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          <option value="" disabled>— Selecciona —</option>
          {(clients ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Dirección
        </label>
        <input
          id="address"
          name="address"
          defaultValue={defaults?.address ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
    </>
  )
}
