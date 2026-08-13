'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireClient } from '@/lib/auth'

export async function requestMaintenance(machineId: string, formData: FormData) {
  const { profile } = await requireClient()
  const description = ((formData.get('description') as string) ?? '').trim()
  const supabase = await createClient()

  if (!description) {
    redirect(`/portal/machines/${machineId}?error=${encodeURIComponent('Describe qué necesita.')}`)
  }

  // Defense in depth: confirm the machine belongs to this client and is active.
  const { data: machine } = await supabase
    .from('machines')
    .select('id, location_id')
    .eq('id', machineId)
    .eq('client_id', profile.client_id ?? '')
    .eq('active', true)
    .maybeSingle()

  if (!machine) {
    redirect(`/portal/machines/${machineId}?error=${encodeURIComponent('Máquina no válida.')}`)
  }

  const { error } = await supabase.from('maintenances').insert({
    machine_id: machineId,
    description,
    status: 'solicitado',
    // La sede sale de la máquina que acabamos de leer en el servidor, no del
    // formulario: el cliente no elige dónde queda registrado el trabajo.
    location_id: machine.location_id,
  })

  if (error) {
    redirect(`/portal/machines/${machineId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/portal/machines/${machineId}`)
  redirect(`/portal/machines/${machineId}`)
}
