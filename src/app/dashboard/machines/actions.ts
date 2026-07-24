'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireStaff } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

export async function createMachine(formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const name = formData.get('name') as string
  const serial_number = formData.get('serial_number') as string
  const model = (formData.get('model') as string) || null
  const brand_id = formData.get('brand_id') as string
  const type_id = formData.get('type_id') as string
  const client_id = (formData.get('client_id') as string) || null

  const { error } = await supabase
    .from('machines')
    .insert({ name, serial_number, model, brand_id, type_id, client_id })

  if (error) {
    redirect(`/dashboard/machines/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/machines')
  redirect('/dashboard/machines')
}

export async function updateMachine(id: string, formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const name = formData.get('name') as string
  const serial_number = formData.get('serial_number') as string
  const model = (formData.get('model') as string) || null
  const brand_id = formData.get('brand_id') as string
  const type_id = formData.get('type_id') as string
  const client_id = (formData.get('client_id') as string) || null

  const { error } = await supabase
    .from('machines')
    .update({ name, serial_number, model, brand_id, type_id, client_id })
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
  await supabase.from('machines').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/machines')
}
