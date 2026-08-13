import { describe, it, expect } from 'vitest'
import { formatColones, orDash } from '@/lib/format'

describe('orDash', () => {
  it('devuelve una raya para null y undefined', () => {
    expect(orDash(null)).toBe('—')
    expect(orDash(undefined)).toBe('—')
  })

  it('devuelve una raya para la cadena vacía', () => {
    expect(orDash('')).toBe('—')
  })

  it('conserva el cero, que es un valor y no una ausencia', () => {
    expect(orDash(0)).toBe('0')
  })

  it('devuelve el valor tal cual cuando hay contenido', () => {
    expect(orDash('BOL-999')).toBe('BOL-999')
  })
})

describe('formatColones', () => {
  // OJO: el separador de miles de es-CR es U+00A0 (espacio duro), no un
  // espacio normal. Verificado en esta máquina con Node 22.14 / ICU 76.
  // Se construye con String.fromCharCode para que sea visible en el código:
  // un espacio duro literal es invisible y cualquier reformateo que lo
  // convierta en espacio normal rompería el test sin dejar rastro en el diff.
  const NBSP = String.fromCharCode(0xa0)

  it('agrupa los miles con espacio duro', () => {
    expect(formatColones(113000)).toBe(`₡113${NBSP}000`)
  })

  it('no muestra decimales', () => {
    expect(formatColones(1000)).toBe(`₡1${NBSP}000`)
  })

  it('devuelve una raya para null, no cero', () => {
    expect(formatColones(null)).toBe('—')
  })

  it('formatea el cero como monto', () => {
    expect(formatColones(0)).toBe('₡0')
  })
})
