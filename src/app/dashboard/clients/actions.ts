'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, requireAdmin, requireStaff } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { writeAndRedirect } from '@/lib/crud'

const LISTA = '/dashboard/clients'

function parseForm(formData: FormData) {
  return {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address: (formData.get('address') as string) || null,
  }
}

export async function createClientRecord(formData: FormData) {
  await requireStaff()
  const supabase = await createClient()
  await writeAndRedirect(
    supabase.from('clients').insert(parseForm(formData)),
    LISTA,
    `${LISTA}/new`
  )
}

export async function updateClientRecord(id: string, formData: FormData) {
  await requireStaff()
  const supabase = await createClient()
  await writeAndRedirect(
    supabase.from('clients').update(parseForm(formData)).eq('id', id),
    LISTA,
    `${LISTA}/${id}/edit`
  )
}

export async function deleteClientRecord(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const supabase = await createClient()
  await supabase.from('clients').update({ active: false }).eq('id', id)

  // Offboarding: archiving a client also disables its portal login, if any,
  // so an archived client can no longer sign in or view its data.
  const admin = createAdminClient()
  const { data: access } = await admin
    .from('profiles')
    .select('id')
    .eq('client_id', id)
    .maybeSingle()
  if (access) {
    await admin.auth.admin.updateUserById(access.id, { ban_duration: '876000h' })
  }

  revalidatePath(LISTA)
}

export async function grantPortalAccess(clientId: string, formData: FormData) {
  await requireAdmin()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const volver = `${LISTA}/${clientId}/edit`

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    redirect(`${volver}?error=${encodeURIComponent(error?.message ?? 'Error desconocido')}`)
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
    redirect(`${volver}?error=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath(volver)
  redirect(volver)
}
