'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireStaff } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function parseForm(formData: FormData) {
  return {
    name: formData.get('name') as string,
    // Vacío es null, no ''. El índice único parcial ignora los NULL, pero dos
    // cadenas vacías sí chocarían entre sí: la segunda máquina sin número de
    // serie fallaría al guardar.
    serial_number: (formData.get('serial_number') as string) || null,
    asset_number: (formData.get('asset_number') as string) || null,
    model: (formData.get('model') as string) || null,
    brand_id: formData.get('brand_id') as string,
    type_id: formData.get('type_id') as string,
    client_id: (formData.get('client_id') as string) || null,
    location_id: (formData.get('location_id') as string) || null,
  }
}

/**
 * La sede tiene que ser del cliente dueño. El formulario ya sólo ofrece las
 * sedes del cliente elegido, pero una server action es alcanzable por POST
 * directo, así que la pareja se revalida contra la base.
 */
async function validateLocation(
  supabase: SupabaseServerClient,
  values: ReturnType<typeof parseForm>
): Promise<string | null> {
  if (!values.location_id) return null

  if (!values.client_id) {
    return 'Una sede sólo se puede asignar junto con el cliente dueño.'
  }

  const { data: location } = await supabase
    .from('locations')
    .select('client_id')
    .eq('id', values.location_id)
    .maybeSingle()

  if (!location || location.client_id !== values.client_id) {
    return 'La sede seleccionada no pertenece a ese cliente.'
  }

  return null
}

export async function createMachine(formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const values = parseForm(formData)

  const invalid = await validateLocation(supabase, values)
  if (invalid) {
    redirect(`/dashboard/machines/new?error=${encodeURIComponent(invalid)}`)
  }

  const { error } = await supabase.from('machines').insert(values)

  if (error) {
    redirect(`/dashboard/machines/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/machines')
  redirect('/dashboard/machines')
}

export async function updateMachine(id: string, formData: FormData) {
  await requireStaff()

  const supabase = await createClient()
  const values = parseForm(formData)

  const invalid = await validateLocation(supabase, values)
  if (invalid) {
    redirect(`/dashboard/machines/${id}/edit?error=${encodeURIComponent(invalid)}`)
  }

  const { error } = await supabase.from('machines').update(values).eq('id', id)

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
