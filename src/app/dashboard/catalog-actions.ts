'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser, requireStaff } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { CATALOGS, type CatalogKey } from '@/lib/catalog'
import { writeAndRedirect } from '@/lib/crud'

// El catálogo llega como argumento ligado a la acción, así que se valida
// contra el mapa antes de tocar la base: nadie elige la tabla desde fuera.
function catalogo(key: CatalogKey) {
  const c = CATALOGS[key]
  if (!c) throw new Error('Catálogo desconocido.')
  return c
}

export async function saveCatalogItem(key: CatalogKey, id: string | null, formData: FormData) {
  await requireStaff()
  const c = catalogo(key)

  const supabase = await createClient()
  const values = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
  }

  await writeAndRedirect(
    id
      ? supabase.from(c.tabla).update(values).eq('id', id)
      : supabase.from(c.tabla).insert(values),
    c.ruta,
    id ? `${c.ruta}/${id}/edit` : `${c.ruta}/new`
  )
}

export async function archiveCatalogItem(key: CatalogKey, id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const c = catalogo(key)
  const supabase = await createClient()
  await supabase.from(c.tabla).update({ active: false }).eq('id', id)
  revalidatePath(c.ruta)
}
