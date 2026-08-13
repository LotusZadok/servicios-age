'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireStaff } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

// Un campo numérico vacío es null, no 0: un mantenimiento sin facturar todavía
// no cuesta cero, simplemente no tiene monto.
function numberOrNull(formData: FormData, field: string): number | null {
  const raw = (formData.get(field) as string | null)?.trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseForm(formData: FormData) {
  return {
    machine_id: formData.get('machine_id') as string,
    // Instantánea del lugar del trabajo. El formulario la propone desde la
    // máquina, pero una vez guardada sólo cambia si alguien la edita a mano:
    // nada la vuelve a sincronizar cuando la máquina se traslada.
    location_id: (formData.get('location_id') as string) || null,
    technician_id: (formData.get('technician_id') as string) || null,
    date: (formData.get('date') as string) || null,
    description: formData.get('description') as string,
    is_corrective: formData.get('is_corrective') === 'on',
    cost_subtotal: numberOrNull(formData, 'cost_subtotal'),
    tax_amount: numberOrNull(formData, 'tax_amount'),
    // cost_total no se envía: es una columna generada en la base.
    hour_meter: numberOrNull(formData, 'hour_meter'),
    report_ref: (formData.get('report_ref') as string) || null,
    quote_ref: (formData.get('quote_ref') as string) || null,
    status: formData.get('status') as string,
  }
}

export async function createMaintenance(formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const { error } = await supabase.from('maintenances').insert(parseForm(formData))

  if (error) {
    redirect(`/dashboard/maintenances/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/maintenances')
  redirect('/dashboard/maintenances')
}

export async function updateMaintenance(id: string, formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const { error } = await supabase.from('maintenances').update(parseForm(formData)).eq('id', id)

  if (error) {
    redirect(`/dashboard/maintenances/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/maintenances')
  redirect('/dashboard/maintenances')
}

export async function deleteMaintenance(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const supabase = await createClient()
  await supabase.from('maintenances').delete().eq('id', id)
  revalidatePath('/dashboard/maintenances')
}
