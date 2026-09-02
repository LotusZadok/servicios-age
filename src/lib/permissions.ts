export type Role = 'admin' | 'empleado' | 'cliente'

export function canDelete(role: Role): boolean {
  return role === 'admin'
}

export function canManageUsers(role: Role): boolean {
  return role === 'admin'
}

export function isStaff(role: Role): boolean {
  return role === 'admin' || role === 'empleado'
}

export function homePathForRole(role: Role): string {
  return role === 'cliente' ? '/portal' : '/dashboard'
}

/**
 * Un perfil con `client_id` es el acceso al portal de un cliente, y su rol es
 * siempre 'cliente'. La pantalla de usuarios gestiona sólo cuentas internas: no
 * convierte un acceso de portal en personal (que le daría visibilidad sobre
 * todos los datos conservando el `client_id`) ni al revés, porque el alta de
 * portal tiene su propio flujo en la ficha del cliente.
 *
 * Devuelve el motivo del rechazo, o null si el cambio es válido. Devuelve el
 * texto y no un booleano porque cada rechazo se explica distinto y quien llama
 * tiene que poder mostrarlo.
 */
export function roleChangeBlockedReason({
  actorRole,
  targetRole,
  targetClientId,
  nextRole,
  adminCount,
}: {
  actorRole: Role
  targetRole: Role
  targetClientId: string | null
  nextRole: Role
  adminCount: number
}): string | null {
  if (!canManageUsers(actorRole)) {
    return 'Solo un administrador puede cambiar roles.'
  }

  if (targetClientId !== null) {
    return 'Esta cuenta es el acceso al portal de un cliente. Su rol no se cambia desde aquí.'
  }

  if (nextRole === 'cliente') {
    return 'Para dar acceso al portal, usa la ficha del cliente.'
  }

  // La guarda de siempre: sin ningún administrador nadie podría volver a
  // gestionar cuentas, porque /dashboard/users es sólo para admin.
  if (targetRole === 'admin' && nextRole !== 'admin' && adminCount <= 1) {
    return 'No puedes quitar el rol al último administrador.'
  }

  return null
}
