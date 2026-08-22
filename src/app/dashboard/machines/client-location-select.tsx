'use client'

import { useState } from 'react'

type Client = { id: string; name: string }
type Location = { id: string; name: string; client_id: string; active: boolean }

/**
 * Selects de cliente dueño y sede actual, acoplados.
 *
 * Una sede pertenece a un cliente, así que ofrecer todas las sedes junto a
 * todos los clientes deja elegir combinaciones imposibles. Acá el select de
 * sede sólo muestra las sedes del cliente elegido, y al cambiar de cliente la
 * sede se limpia (la anterior ya no aplica). La server action revalida la
 * pareja: esto es comodidad, no la barrera de integridad.
 *
 * Si la sede guardada fue archivada sigue apareciendo, marcada, para que
 * editar cualquier otro campo de la máquina no la borre en silencio.
 */
export function ClientLocationSelect({
  clients,
  locations,
  defaultClientId,
  defaultLocationId,
}: {
  clients: Client[]
  locations: Location[]
  defaultClientId?: string | null
  defaultLocationId?: string | null
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? '')
  const [locationId, setLocationId] = useState(defaultLocationId ?? '')

  const available = locations.filter((l) => l.client_id === clientId)

  return (
    <>
      <div>
        <label htmlFor="client_id">Cliente dueño (opcional)</label>
        <select
          id="client_id"
          name="client_id"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value)
            setLocationId('')
          }}
          className="field"
        >
          <option value="">— Sin asignar —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="location_id">Sede actual (opcional)</label>
        <select
          id="location_id"
          name="location_id"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          disabled={!clientId}
          className="field"
        >
          <option value="">— Sin asignar —</option>
          {available.map((l) => (
            <option key={l.id} value={l.id}>
              {l.active ? l.name : `${l.name} (archivada)`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {clientId
            ? 'Es la ubicación actual. Cámbiala cuando la máquina se preste a otra tienda.'
            : 'Elegí primero un cliente dueño para ver sus sedes.'}
        </p>
      </div>
    </>
  )
}
