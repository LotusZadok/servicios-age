'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, requireAdmin } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = (formData.get('address') as string) || null

  const { error } = await supabase.from('clients').insert({ name, email, phone, address })

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
  const address = (formData.get('address') as string) || null

  const { error } = await supabase
    .from('clients')
    .update({ name, email, phone, address })
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
  await supabase.from('clients').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/clients')
}

export async function grantPortalAccess(clientId: string, formData: FormData) {
  await requireAdmin()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    redirect(
      `/dashboard/clients/${clientId}/edit?error=${encodeURIComponent(error?.message ?? 'Error desconocido')}`
    )
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    role: 'cliente',
    client_id: clientId,
  })

  if (profileError) {
    // Roll back the orphaned auth user so the email stays reusable.
    await admin.auth.admin.deleteUser(data.user.id)
    redirect(
      `/dashboard/clients/${clientId}/edit?error=${encodeURIComponent(profileError.message)}`
    )
  }

  revalidatePath(`/dashboard/clients/${clientId}/edit`)
  redirect(`/dashboard/clients/${clientId}/edit`)
}
