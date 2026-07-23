'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase.from('clients').insert({ name, email, phone })

  if (error) {
    redirect(`/dashboard/clients/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

export async function updateClientRecord(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('clients')
    .update({ name, email, phone })
    .eq('id', id)

  if (error) {
    redirect(`/dashboard/clients/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

export async function deleteClientRecord(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const supabase = await createClient()
  await supabase.from('clients').delete().eq('id', id)
  revalidatePath('/dashboard/clients')
}
