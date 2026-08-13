/**
 * Contenedor de scroll horizontal para las tablas de listado.
 *
 * El sangrado negativo (-mx-4) cancela el padding del <main> para que la banda
 * de scroll llegue al borde de la pantalla: si no, la tabla se corta contra el
 * padding y parece truncada en vez de desplazable. A partir de sm el ancho
 * disponible alcanza y el sangrado se anula.
 *
 * Va por fuera de la tabla a propósito. La alternativa —display:block sobre el
 * propio <table>— también scrollea, pero le quita los roles ARIA implícitos
 * (table/row/cell) en Chromium y WebKit, y deja la tabla sin estructura para
 * lectores de pantalla justo en el viewport donde más falta hace.
 */
export function TableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">{children}</div>
  )
}
