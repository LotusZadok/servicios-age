import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAdminClient } from '../src/lib/supabase/admin-core'

// One-time local seed for the portal E2E: a brand, a type, a client with portal
// access, a machine owned by that client, and one maintenance record.
async function main() {
  const admin = createAdminClient()

  const { data: brand } = await admin
    .from('brands')
    .upsert({ name: 'Marca E2E' }, { onConflict: 'name' })
    .select('id')
    .single()

  const { data: type } = await admin
    .from('machine_types')
    .upsert({ name: 'Tipo E2E' }, { onConflict: 'name' })
    .select('id')
    .single()

  if (!brand || !type) throw new Error('brand/type seed failed')

  // Client record (find-or-create by name).
  const { data: existingClient } = await admin
    .from('clients')
    .select('id')
    .eq('name', 'Cliente Portal Test')
    .maybeSingle()

  let clientId = existingClient?.id
  if (!clientId) {
    const { data: client, error } = await admin
      .from('clients')
      .insert({ name: 'Cliente Portal Test', email: 'portal@agservicios.local', phone: '555-1234', address: 'Zona E2E' })
      .select('id')
      .single()
    if (error || !client) throw new Error('client seed failed: ' + error?.message)
    clientId = client.id
  }

  // Two sedes for that client: la máquina vive en la primera, y la segunda
  // existe para que el E2E pueda comprobar que el select filtra por cliente.
  const { data: location } = await admin
    .from('locations')
    .upsert(
      { client_id: clientId, name: 'Sede Central E2E', address: 'Avenida E2E 1' },
      { onConflict: 'client_id,name' }
    )
    .select('id')
    .single()

  await admin
    .from('locations')
    .upsert(
      { client_id: clientId, name: 'Sede Norte E2E', address: 'Avenida E2E 2' },
      { onConflict: 'client_id,name' }
    )

  if (!location) throw new Error('location seed failed')

  // A machine owned by that client.
  const { data: existingMachine } = await admin
    .from('machines')
    .select('id')
    .eq('serial_number', 'E2E-0001')
    .maybeSingle()

  let machineId = existingMachine?.id
  if (!machineId) {
    const { data: machine, error } = await admin
      .from('machines')
      .insert({ name: 'Excavadora E2E', serial_number: 'E2E-0001', asset_number: 'ACT-E2E-1', model: 'X-100', brand_id: brand.id, type_id: type.id, client_id: clientId, location_id: location.id })
      .select('id')
      .single()
    if (error || !machine) throw new Error('machine seed failed: ' + error?.message)
    machineId = machine.id
  }

  // One maintenance for that machine.
  const { data: existingMaint } = await admin
    .from('maintenances')
    .select('id')
    .eq('machine_id', machineId)
    .maybeSingle()
  if (!existingMaint) {
    await admin.from('maintenances').insert({
      machine_id: machineId,
      location_id: location.id,
      date: '2026-07-01',
      description: 'Mantenimiento inicial E2E',
      is_corrective: false,
      status: 'completado',
      hour_meter: 1200,
      cost_subtotal: 50000,
      tax_amount: 6500,
      report_ref: 'BOL-E2E-1',
      quote_ref: 'PRO-E2E-1',
    })
  }

  // Portal login for the client (create-or-skip).
  const { data: list } = await admin.auth.admin.listUsers()
  const existingUser = list.users.find((u) => u.email === 'portal@agservicios.local')
  if (!existingUser) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: 'portal@agservicios.local',
      password: 'changeme123',
      email_confirm: true,
    })
    if (error || !created.user) throw new Error('portal user creation failed: ' + error?.message)
    const { error: pErr } = await admin.from('profiles').insert({
      id: created.user.id,
      full_name: 'Cliente Portal Test',
      role: 'cliente',
      client_id: clientId,
    })
    if (pErr) {
      await admin.auth.admin.deleteUser(created.user.id)
      throw new Error('portal profile insert failed: ' + pErr.message)
    }
  }

  console.log('Portal E2E seed OK. clientId=', clientId, 'machineId=', machineId)
}

main()
