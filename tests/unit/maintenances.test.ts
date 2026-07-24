import { describe, expect, it } from 'vitest'
import { isRequest, sortRequestsFirst } from '@/lib/maintenances'

describe('isRequest', () => {
  it('true for solicitado', () => expect(isRequest('solicitado')).toBe(true))
  it('false for programado', () => expect(isRequest('programado')).toBe(false))
  it('false for completado', () => expect(isRequest('completado')).toBe(false))
})

describe('sortRequestsFirst', () => {
  it('puts solicitado rows before others', () => {
    const rows = [
      { status: 'completado', date: '2026-07-10', created_at: '2026-07-10T00:00:00Z' },
      { status: 'solicitado', date: null, created_at: '2026-07-05T00:00:00Z' },
      { status: 'programado', date: '2026-07-20', created_at: '2026-07-15T00:00:00Z' },
    ]
    const sorted = sortRequestsFirst(rows)
    expect(sorted[0].status).toBe('solicitado')
  })

  it('orders non-requests by newest date first', () => {
    const rows = [
      { status: 'completado', date: '2026-07-10', created_at: '2026-07-10T00:00:00Z' },
      { status: 'programado', date: '2026-07-20', created_at: '2026-07-15T00:00:00Z' },
    ]
    const sorted = sortRequestsFirst(rows)
    expect(sorted[0].date).toBe('2026-07-20')
  })

  it('does not mutate the input array', () => {
    const rows = [
      { status: 'completado', date: '2026-07-10', created_at: '2026-07-10T00:00:00Z' },
      { status: 'solicitado', date: null, created_at: '2026-07-05T00:00:00Z' },
    ]
    const copy = [...rows]
    sortRequestsFirst(rows)
    expect(rows).toEqual(copy)
  })
})
