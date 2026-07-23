'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

export async function createBrand(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null

  const { error } = await supabase.from('brands').insert({ name, description })

  if (error) {
    redirect(`/dashboard/brands/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/brands')
  redirect('/dashboard/brands')
}

export async function updateBrand(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null

  const { error } = await supabase.from('brands').update({ name, description }).eq('id', id)

  if (error) {
    redirect(`/dashboard/brands/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/brands')
  redirect('/dashboard/brands')
}

export async function deleteBrand(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const supabase = await createClient()
  await supabase.from('brands').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/brands')
}
