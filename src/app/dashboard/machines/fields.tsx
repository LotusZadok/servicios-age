import { createClient } from '@/lib/supabase/server'
import { ClientLocationSelect } from './client-location-select'

type MachineDefaults = {
  name?: string
  serial_number?: string | null
  asset_number?: string | null
  model?: string | null
  brand_id?: string
  type_id?: string
  client_id?: string | null
  location_id?: string | null
}

export async function MachineFields({ defaults }: { defaults?: MachineDefaults }) {
  const supabase = await createClient()

  // La sede ya guardada se incluye aunque esté archivada: si no, editar
  // cualquier otro campo la borraría en silencio al reenviar el formulario.
  const locationsQuery = supabase.from('locations').select('id, name, client_id, active')
  const [{ data: brands }, { data: types }, { data: clients }, { data: locations }] =
    await Promise.all([
      supabase.from('brands').select('id, name').eq('active', true).order('name'),
      supabase.from('machine_types').select('id, name').eq('active', true).order('name'),
      supabase.from('clients').select('id, name').eq('active', true).order('name'),
      (defaults?.location_id
        ? locationsQuery.or(`active.eq.true,id.eq.${defaults.location_id}`)
        : locationsQuery.eq('active', true)
      ).order('name'),
    ])

  return (
    <>
      <div>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name ?? ''}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="serial_number">Número de serie (opcional)</label>
        <input
          id="serial_number"
          name="serial_number"
          defaultValue={defaults?.serial_number ?? ''}
          className="field"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Del fabricante. Si se llena, no puede repetirse en otra máquina.
        </p>
      </div>
      <div>
        <label htmlFor="asset_number">Número de activo (opcional)</label>
        <input
          id="asset_number"
          name="asset_number"
          defaultValue={defaults?.asset_number ?? ''}
          className="field"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          La placa de inventario del cliente. Puede repetirse entre clientes.
        </p>
      </div>
      <div>
        <label htmlFor="model">Modelo</label>
        <input id="model" name="model" defaultValue={defaults?.model ?? ''} className="field" />
      </div>
      <div>
        <label htmlFor="brand_id">Marca</label>
        <select
          id="brand_id"
          name="brand_id"
          required
          defaultValue={defaults?.brand_id ?? ''}
          className="field"
        >
          {(brands ?? []).map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="type_id">Tipo</label>
        <select
          id="type_id"
          name="type_id"
          required
          defaultValue={defaults?.type_id ?? ''}
          className="field"
        >
          {(types ?? []).map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </div>
      <ClientLocationSelect
        clients={clients ?? []}
        locations={locations ?? []}
        defaultClientId={defaults?.client_id}
        defaultLocationId={defaults?.location_id}
      />
    </>
  )
}
