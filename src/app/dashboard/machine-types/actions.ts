'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

export async function createMachineType(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  const { error } = await supabase.from('machine_types').insert({ name })

  if (error) {
    redirect(`/dashboard/machine-types/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/machine-types')
  redirect('/dashboard/machine-types')
}

export async function updateMachineType(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  const { error } = await supabase.from('machine_types').update({ name }).eq('id', id)

  if (error) {
    redirect(`/dashboard/machine-types/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/machine-types')
  redirect('/dashboard/machine-types')
}

export async function deleteMachineType(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const supabase = await createClient()
  await supabase.from('machine_types').delete().eq('id', id)
  revalidatePath('/dashboard/machine-types')
}
