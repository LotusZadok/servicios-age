'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireStaff } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

function parseForm(formData: FormData) {
  return {
    client_id: formData.get('client_id') as string,
    name: formData.get('name') as string,
    address: (formData.get('address') as string) || null,
  }
}

export async function createLocation(formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const { error } = await supabase.from('locations').insert(parseForm(formData))

  if (error) {
    redirect(`/dashboard/locations/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/locations')
  redirect('/dashboard/locations')
}

export async function updateLocation(id: string, formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const { error } = await supabase.from('locations').update(parseForm(formData)).eq('id', id)

  if (error) {
    redirect(`/dashboard/locations/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/locations')
  redirect('/dashboard/locations')
}

export async function deleteLocation(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  // Baja lógica, igual que el resto del catálogo: las máquinas y los
  // mantenimientos que apuntan a esta sede conservan la referencia y su
  // historial sigue diciendo dónde se atendió.
  const supabase = await createClient()
  await supabase.from('locations').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/locations')
}
