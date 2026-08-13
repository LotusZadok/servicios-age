'use client'

import { useState } from 'react'

type Machine = { id: string; name: string; client_id: string | null; location_id: string | null }
type Location = { id: string; name: string; client_id: string; active: boolean }

/**
 * Selects de máquina y sede, acoplados.
 *
 * La sede del mantenimiento es una INSTANTÁNEA de dónde se hizo el trabajo,
 * no un espejo de dónde está la máquina hoy. Por eso al elegir una máquina se
 * pre-llena con su ubicación actual pero queda editable, y por eso nada la
 * vuelve a tocar después: si la máquina se presta a otra tienda, el historial
 * debe seguir diciendo dónde se atendió.
 *
 * Al abrir el formulario de edición el valor guardado gana; sólo cambiar de
 * máquina vuelve a proponer una sede.
 */
export function MachineLocationSelect({
  machines,
  locations,
  defaultMachineId,
  defaultLocationId,
}: {
  machines: Machine[]
  locations: Location[]
  defaultMachineId?: string
  defaultLocationId?: string | null
}) {
  const [machineId, setMachineId] = useState(defaultMachineId ?? '')
  const [locationId, setLocationId] = useState(defaultLocationId ?? '')

  const machine = machines.find((m) => m.id === machineId)
  const available = locations.filter(
    // La sede ya guardada se muestra siempre, aunque el cliente de la máquina
    // haya cambiado: perderla sería reescribir el historial.
    (l) => (machine?.client_id != null && l.client_id === machine.client_id) || l.id === locationId
  )

  return (
    <>
      <div>
        <label htmlFor="machine_id" className="block text-sm font-medium">Máquina</label>
        <select
          id="machine_id"
          name="machine_id"
          required
          value={machineId}
          onChange={(e) => {
            setMachineId(e.target.value)
            const next = machines.find((m) => m.id === e.target.value)
            setLocationId(next?.location_id ?? '')
          }}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          <option value="" disabled>— Selecciona —</option>
          {machines.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="location_id" className="block text-sm font-medium">
          Sede donde se atendió (opcional)
        </label>
        <select
          id="location_id"
          name="location_id"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          <option value="">— Sin registrar —</option>
          {available.map((l) => (
            <option key={l.id} value={l.id}>
              {l.active ? l.name : `${l.name} (archivada)`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Se propone la ubicación actual de la máquina. Queda fija: no cambia si
          después la máquina se traslada.
        </p>
      </div>
    </>
  )
}
