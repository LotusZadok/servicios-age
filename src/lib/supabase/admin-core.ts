import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Plain factory with no `server-only` guard, so standalone Node scripts
// (e.g. scripts/seed-admin.ts run under tsx, outside a bundler) can import it.
// Application code must import from `./admin` instead, which adds the guard.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
