'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

export async function createMachine(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const serial_number = formData.get('serial_number') as string
  const brand_id = formData.get('brand_id') as string
  const type_id = formData.get('type_id') as string

  const { error } = await supabase
    .from('machines')
    .insert({ name, serial_number, brand_id, type_id })

  if (error) {
    redirect(`/dashboard/machines/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/machines')
  redirect('/dashboard/machines')
}

export async function updateMachine(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const serial_number = formData.get('serial_number') as string
  const brand_id = formData.get('brand_id') as string
  const type_id = formData.get('type_id') as string

  const { error } = await supabase
    .from('machines')
    .update({ name, serial_number, brand_id, type_id })
    .eq('id', id)

  if (error) {
    redirect(`/dashboard/machines/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/machines')
  redirect('/dashboard/machines')
}

export async function deleteMachine(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const supabase = await createClient()
  await supabase.from('machines').delete().eq('id', id)
  revalidatePath('/dashboard/machines')
}
