import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { updateClientRecord, grantPortalAccess } from '../../actions'

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { profile: currentProfile } = await requireUser()
  const { data: existingAccess } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('client_id', id)
    .maybeSingle()
  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()

  if (!client) {
    notFound()
  }

  const updateClientWithId = updateClientRecord.bind(null, id)

  return (
    <div>
      <form action={updateClientWithId} className="max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Editar cliente</h1>
      {error && <p className="text-sm link-danger">{error}</p>}
      <div>
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" defaultValue={client.name} required className="field" />
      </div>
      <div>
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={client.email ?? ''}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="phone">Teléfono</label>
        <input id="phone" name="phone" defaultValue={client.phone ?? ''} className="field" />
      </div>
      <div>
        <label htmlFor="address">Dirección</label>
        <input
          id="address"
          name="address"
          defaultValue={client.address ?? ''}
          className="field"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
      </form>

      {canManageUsers(currentProfile.role) && (
        <section className="mt-8 max-w-sm border-t pt-6">
          <h2 className="text-lg font-semibold">Acceso al portal</h2>
          {existingAccess ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Este cliente ya tiene acceso al portal ({existingAccess.full_name}).
            </p>
          ) : (
            <form action={grantPortalAccess.bind(null, id)} className="mt-3 space-y-3">
              <input type="hidden" name="full_name" value={client.name} />
              <div>
                <label htmlFor="access-email">Correo de acceso</label>
                <input
                  id="access-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={client.email ?? ''}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="access-password">Contraseña temporal</label>
                <input
                  id="access-password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="field"
                />
              </div>
              <button type="submit" className="btn btn-ghost">
                Habilitar acceso al portal
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
