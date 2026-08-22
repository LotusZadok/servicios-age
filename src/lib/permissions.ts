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
