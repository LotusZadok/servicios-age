import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { Role } from '@/lib/permissions'

// The generated DB type widens the check-constrained `role` column to `string`.
// The DB constraint guarantees it is a valid Role, so we narrow it here once,
// giving every caller of requireUser/requireAdmin a properly typed role.
type Profile = Omit<Database['public']['Tables']['profiles']['Row'], 'role'> & {
  role: Role
}

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return { user, profile: profile as Profile }
}

export async function requireAdmin() {
  const { user, profile } = await requireUser()

  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return { user, profile }
}
