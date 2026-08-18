'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function NavLink({
  href,
  children,
  count,
  label,
}: {
  href: string
  children: React.ReactNode
  /** Pendientes a mostrar como chip. 0 o undefined no renderizan nada. */
  count?: number
  /** Nombre accesible cuando el chip lo haría ilegible ("Mantenimientos 3"). */
  label?: string
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${href}/`)
  const ref = useRef<HTMLAnchorElement>(null)

  // Debajo de md la tira de pestañas desborda, y si el destino actual quedó
  // fuera de la ventana el usuario aterriza sin ver dónde está parado.
  // `nearest` no hace nada cuando el link ya se ve, y en el eje vertical evita
  // pelearse con el header sticky.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [active])

  return (
    <Link
      ref={ref}
      href={href}
      className="nav-link"
      data-active={active}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      {children}
      {count ? <span className="nav-badge">{count}</span> : null}
    </Link>
  )
}
