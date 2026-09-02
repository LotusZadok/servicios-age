import { describe, expect, it } from 'vitest'
import {
  canDelete,
  canManageUsers,
  isStaff,
  homePathForRole,
  roleChangeBlockedReason,
} from '@/lib/permissions'

describe('canDelete', () => {
  it('allows admin', () => expect(canDelete('admin')).toBe(true))
  it('denies empleado', () => expect(canDelete('empleado')).toBe(false))
  it('denies cliente', () => expect(canDelete('cliente')).toBe(false))
})

describe('canManageUsers', () => {
  it('allows admin', () => expect(canManageUsers('admin')).toBe(true))
  it('denies empleado', () => expect(canManageUsers('empleado')).toBe(false))
  it('denies cliente', () => expect(canManageUsers('cliente')).toBe(false))
})

describe('isStaff', () => {
  it('admin is staff', () => expect(isStaff('admin')).toBe(true))
  it('empleado is staff', () => expect(isStaff('empleado')).toBe(true))
  it('cliente is not staff', () => expect(isStaff('cliente')).toBe(false))
})

describe('homePathForRole', () => {
  it('sends clients to /portal', () => expect(homePathForRole('cliente')).toBe('/portal'))
  it('sends admin to /dashboard', () => expect(homePathForRole('admin')).toBe('/dashboard'))
  it('sends empleado to /dashboard', () => expect(homePathForRole('empleado')).toBe('/dashboard'))
})

describe('roleChangeBlockedReason', () => {
  // Caso base: un admin sube a otro empleado, y hay más de un admin.
  const valido = {
    actorRole: 'admin',
    targetRole: 'empleado',
    targetClientId: null,
    nextRole: 'admin',
    adminCount: 2,
  } as const

  it('permite el cambio entre roles internos', () => {
    expect(roleChangeBlockedReason(valido)).toBeNull()
  })

  it('permite degradar a empleado si queda otro admin', () => {
    expect(
      roleChangeBlockedReason({
        ...valido,
        targetRole: 'admin',
        nextRole: 'empleado',
        adminCount: 2,
      })
    ).toBeNull()
  })

  // El fallo que motivó la restricción: el objetivo es un acceso de portal.
  it('bloquea el cambio sobre un perfil con client_id', () => {
    const motivo = roleChangeBlockedReason({
      ...valido,
      targetRole: 'cliente',
      targetClientId: 'algún-cliente',
    })
    expect(motivo).toContain('acceso al portal')
  })

  it('bloquea el perfil con client_id aunque el rol destino sea empleado', () => {
    expect(
      roleChangeBlockedReason({
        ...valido,
        targetRole: 'cliente',
        targetClientId: 'algún-cliente',
        nextRole: 'empleado',
      })
    ).not.toBeNull()
  })

  it('bloquea convertir una cuenta interna en cliente', () => {
    const motivo = roleChangeBlockedReason({ ...valido, nextRole: 'cliente' })
    expect(motivo).toContain('ficha del cliente')
  })

  it('bloquea a quien no es admin', () => {
    const motivo = roleChangeBlockedReason({ ...valido, actorRole: 'empleado' })
    expect(motivo).toContain('Solo un administrador')
  })

  it('bloquea al cliente como actor', () => {
    expect(roleChangeBlockedReason({ ...valido, actorRole: 'cliente' })).not.toBeNull()
  })

  it('bloquea degradar al último administrador', () => {
    const motivo = roleChangeBlockedReason({
      ...valido,
      targetRole: 'admin',
      nextRole: 'empleado',
      adminCount: 1,
    })
    expect(motivo).toContain('último administrador')
  })

  it('permite reasignar admin sobre sí mismo aunque sea el último', () => {
    expect(
      roleChangeBlockedReason({
        ...valido,
        targetRole: 'admin',
        nextRole: 'admin',
        adminCount: 1,
      })
    ).toBeNull()
  })

  // Un empleado no es el último admin por mucho que sólo quede uno: la guarda
  // mira el rol del objetivo, no el conteo a secas.
  it('no confunde a un empleado con el último administrador', () => {
    expect(
      roleChangeBlockedReason({
        ...valido,
        targetRole: 'empleado',
        nextRole: 'empleado',
        adminCount: 1,
      })
    ).toBeNull()
  })
})
