'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireStaff } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

function parseForm(formData: FormData) {
  return {
    machine_id: formData.get('machine_id') as string,
    technician_id: (formData.get('technician_id') as string) || null,
    date: formData.get('date') as string,
    description: formData.get('description') as string,
    is_corrective: formData.get('is_corrective') === 'on',
    cost: formData.get('cost') ? Number(formData.get('cost')) : null,
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
