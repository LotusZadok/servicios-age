export type Role = 'admin' | 'empleado'

export function canDelete(role: Role): boolean {
  return role === 'admin'
}

export function canManageUsers(role: Role): boolean {
  return role === 'admin'
}
