import { describe, expect, it } from 'vitest'
import { canDelete, canManageUsers } from '@/lib/permissions'

describe('canDelete', () => {
  it('allows admin to delete', () => {
    expect(canDelete('admin')).toBe(true)
  })

  it('does not allow empleado to delete', () => {
    expect(canDelete('empleado')).toBe(false)
  })
})

describe('canManageUsers', () => {
  it('allows admin to manage users', () => {
    expect(canManageUsers('admin')).toBe(true)
  })

  it('does not allow empleado to manage users', () => {
    expect(canManageUsers('empleado')).toBe(false)
  })
})
