import 'server-only'

// Service-role client: bypasses RLS. The `server-only` import above makes any
// attempt to bundle this into Client Component code a build-time error.
// Standalone Node scripts should import from `./admin-core` instead.
export { createAdminClient } from './admin-core'
