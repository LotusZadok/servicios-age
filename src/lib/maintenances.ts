// IVA vigente. Sólo sirve para PRE-LLENAR el campo de impuesto en el
// formulario: lo que se guarda en la base es el monto (tax_amount), no la
// tasa, así que si el IVA cambia los mantenimientos ya registrados siguen
// cuadrando con la boleta que se emitió ese día.
export const TAX_RATE = 0.13

// Redondea a dos decimales, que es la escala de numeric(12,2) en la base.
export function defaultTaxAmount(subtotal: number | null): number | null {
  if (subtotal === null || !Number.isFinite(subtotal)) return null
  return Math.round(subtotal * TAX_RATE * 100) / 100
}

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
