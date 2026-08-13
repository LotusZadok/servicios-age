/**
 * Presentación de datos en listados. Puro: sin Supabase, sin async.
 *
 * La ausencia se muestra siempre igual, con una raya. Antes convivían `''`
 * para los importes y `'—'` para las fechas, y una celda vacía no se
 * distinguía de una celda que el servidor no llenó.
 */

const COLONES = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Placeholder único para toda ausencia de valor. El cero no es ausencia. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

/** Importe en colones, sin decimales. Null se muestra como ausencia, no como cero. */
export function formatColones(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return COLONES.format(value)
}
