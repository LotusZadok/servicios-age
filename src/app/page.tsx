import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { homePathForRole } from '@/lib/permissions'

export default async function Home() {
  const { profile } = await requireUser()
  redirect(homePathForRole(profile.role))
}
