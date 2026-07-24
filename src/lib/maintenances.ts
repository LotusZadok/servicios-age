export function isRequest(status: string): boolean {
  return status === 'solicitado'
}

// Pending client requests first; within each group, newest first. A request has
// no scheduled date, so it falls back to created_at for the secondary sort.
export function sortRequestsFirst<
  T extends { status: string; date: string | null; created_at: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = isRequest(a.status) ? 0 : 1
    const rb = isRequest(b.status) ? 0 : 1
    if (ra !== rb) return ra - rb
    const da = a.date ?? a.created_at
    const db = b.date ?? b.created_at
    return db.localeCompare(da)
  })
}
