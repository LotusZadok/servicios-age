'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function createUser(formData: FormData) {
  await requireAdmin()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    redirect(
      `/dashboard/users/new?error=${encodeURIComponent(error?.message ?? 'Error desconocido')}`
    )
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    role,
  })

  if (profileError) {
    // Roll back the orphaned auth user so the email stays reusable.
    await admin.auth.admin.deleteUser(data.user.id)
    redirect(`/dashboard/users/new?error=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}

export async function updateUserRole(id: string, formData: FormData) {
  await requireAdmin()

  const role = formData.get('role') as string
  const admin = createAdminClient()

  // Prevent demoting the last remaining admin, which would lock everyone out
  // of user management (the /dashboard/users routes are admin-only).
  if (role !== 'admin') {
    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    const isLastAdmin =
      admins != null && admins.length <= 1 && admins.some((a) => a.id === id)

    if (isLastAdmin) {
      redirect(
        `/dashboard/users?error=${encodeURIComponent('No puedes quitar el rol al último administrador.')}`
      )
    }
  }

  const { error } = await admin.from('profiles').update({ role }).eq('id', id)

  if (error) {
    redirect(`/dashboard/users?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/users')
}
