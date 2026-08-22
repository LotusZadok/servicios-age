process.loadEnvFile('.env.local')

import { createAdminClient } from '../src/lib/supabase/admin-core'

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const fullName = process.argv[4]

  if (!email || !password || !fullName) {
    console.error('Uso: npx tsx scripts/seed-admin.ts <email> <password> "<nombre completo>"')
    process.exit(1)
  }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    console.error('Error creando usuario:', error?.message)
    process.exit(1)
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    role: 'admin',
  })

  if (profileError) {
    // Roll back the orphaned auth user so the email stays reusable.
    await admin.auth.admin.deleteUser(data.user.id)
    console.error('Error creando perfil:', profileError.message)
    process.exit(1)
  }

  console.log(`Admin creado: ${email}`)
}

main()
