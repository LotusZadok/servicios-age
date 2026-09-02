'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { roleChangeBlockedReason, type Role } from '@/lib/permissions'

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

// OJO con la capa que protege este camino.
//
// Esta acción escribe con el cliente de rol de servicio, que **ignora RLS**:
// ninguna política de `profiles` filtra nada de lo que sigue, y
// `profiles_update_admin_only` no llega a evaluarse. Lo que impide de verdad
// convertir el acceso de portal de un cliente en una cuenta de personal es la
// restricción `profiles_portal_role` de la tabla —un CHECK, no una política, y
// por eso sí aplica al rol de servicio— más la validación de aquí abajo, que
// existe para dar un mensaje entendible en vez de un error de base de datos.
export async function updateUserRole(id: string, formData: FormData) {
  const { profile } = await requireAdmin()

  const role = formData.get('role') as Role
  const admin = createAdminClient()

  const { data: target } = await admin
    .from('profiles')
    .select('role, client_id')
    .eq('id', id)
    .maybeSingle()

  if (!target) {
    redirect(`/dashboard/users?error=${encodeURIComponent('La cuenta ya no existe.')}`)
  }

  const { count: adminCount } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  const motivo = roleChangeBlockedReason({
    actorRole: profile.role,
    targetRole: target.role as Role,
    targetClientId: target.client_id,
    nextRole: role,
    adminCount: adminCount ?? 0,
  })

  if (motivo) {
    redirect(`/dashboard/users?error=${encodeURIComponent(motivo)}`)
  }

  const { error } = await admin.from('profiles').update({ role }).eq('id', id)

  if (error) {
    redirect(`/dashboard/users?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/users')
}

export async function deleteUser(id: string) {
  const { user } = await requireAdmin()

  if (id === user.id) {
    redirect(
      `/dashboard/users?error=${encodeURIComponent('No puedes eliminar tu propia cuenta.')}`
    )
  }

  const admin = createAdminClient()

  const { data: target } = await admin.from('profiles').select('role').eq('id', id).single()

  // Same lockout guard as updateUserRole: don't let the last admin be removed.
  if (target?.role === 'admin') {
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin')

    if (admins != null && admins.length <= 1) {
      redirect(
        `/dashboard/users?error=${encodeURIComponent('No puedes eliminar al último administrador.')}`
      )
    }
  }

  // profiles.id references auth.users(id) on delete cascade, so this also
  // removes the profile row.
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    redirect(`/dashboard/users?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/users')
}
