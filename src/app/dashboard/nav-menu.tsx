'use client'

import { useState } from 'react'

/**
 * Navegación del dashboard con panel colapsable debajo de md.
 *
 * Los links se reciben como children y se renderizan una sola vez: el patrón
 * habitual de duplicar el menú (uno `md:hidden` y otro `hidden md:flex`) dejaría
 * dos veces cada etiqueta en el DOM, incluido el contador de pendientes, y los
 * E2E que buscan por rol/texto pasarían a encontrar dos coincidencias.
 *
 * De md para arriba el panel está siempre abierto y el botón desaparece, así
 * que `open` sólo gobierna el viewport chico.
 */
export function NavMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="nav-principal"
        className="btn btn-ghost order-2 ml-auto md:hidden"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M3.5 3.5l9 9" />
              <path d="M12.5 3.5l-9 9" />
            </>
          ) : (
            <>
              <path d="M2 4h12" />
              <path d="M2 8h12" />
              <path d="M2 12h12" />
            </>
          )}
        </svg>
        Menú
      </button>

      {/* El panel se cierra al elegir un destino: en móvil ocupa toda la pantalla
          y si quedara abierto taparía la página recién cargada. Se hace por
          delegación en vez de reaccionar al cambio de pathname porque los links
          entran como children y no hay dónde colgarles un handler individual. */}
      <nav
        id="nav-principal"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setOpen(false)
        }}
        className={`order-4 w-full flex-col items-start gap-x-5 gap-y-1 border-t pt-3 md:order-2 md:flex md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-y-2 md:border-0 md:pt-0 ${
          open ? 'flex' : 'hidden'
        }`}
      >
        {children}
      </nav>
    </>
  )
}
