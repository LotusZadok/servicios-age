'use client'

import { useState } from 'react'
import { TAX_RATE, defaultTaxAmount } from '@/lib/maintenances'

/**
 * Subtotal, impuesto y total del mantenimiento.
 *
 * El impuesto se pre-llena al 13 % del subtotal, pero es editable: hay
 * trabajos exentos y hay boletas donde el monto no cuadra al centavo con la
 * tasa. En cuanto alguien toca el campo, deja de recalcularse solo — si no,
 * el valor escrito a mano desaparecería al corregir el subtotal.
 *
 * El total no se envía: es una columna generada en la base. Acá se muestra
 * sólo para confirmar de un vistazo lo que se va a guardar.
 */
export function CostFields({
  defaultSubtotal,
  defaultTax,
}: {
  defaultSubtotal?: number | null
  defaultTax?: number | null
}) {
  const [subtotal, setSubtotal] = useState(defaultSubtotal?.toString() ?? '')
  const [tax, setTax] = useState(defaultTax?.toString() ?? '')
  // Un impuesto ya guardado cuenta como escrito a mano: no lo pisamos.
  const [taxEdited, setTaxEdited] = useState(defaultTax != null)

  const parse = (v: string) => (v.trim() === '' ? null : Number(v))
  const total = (() => {
    const s = parse(subtotal)
    const t = parse(tax)
    if (s === null && t === null) return null
    return (s ?? 0) + (t ?? 0)
  })()

  return (
    <>
      <div>
        <label htmlFor="cost_subtotal">Subtotal</label>
        <input
          id="cost_subtotal"
          name="cost_subtotal"
          type="number"
          step="0.01"
          value={subtotal}
          onChange={(e) => {
            setSubtotal(e.target.value)
            if (!taxEdited) {
              const auto = defaultTaxAmount(parse(e.target.value))
              setTax(auto === null ? '' : auto.toString())
            }
          }}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="tax_amount">Impuesto</label>
        <input
          id="tax_amount"
          name="tax_amount"
          type="number"
          step="0.01"
          value={tax}
          onChange={(e) => {
            setTax(e.target.value)
            setTaxEdited(true)
          }}
          className="field"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Se propone el {Math.round(TAX_RATE * 100)} % del subtotal. Editalo si el
          trabajo es exento o la boleta trae otro monto.
        </p>
      </div>
      <p className="text-sm">
        Total:{' '}
        <span className="mono font-medium">
          {total === null ? '—' : total.toFixed(2)}
        </span>
      </p>
    </>
  )
}
