import { describe, expect, it } from 'vitest'
import {
  canDelete,
  canManageUsers,
  isStaff,
  homePathForRole,
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
