import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * El cierre de toda alta o edición: escribe y vuelve al listado; si la base
 * rechaza, vuelve al formulario con el mensaje en la URL. Era el mismo bloque
 * copiado en cada create/update del panel.
 *
 * Recibe la consulta sin esperar: el builder de supabase-js ya es "thenable",
 * así que el await ocurre acá y el error sale tipado sin envoltorios.
 */
export async function writeAndRedirect(
  write: PromiseLike<{ error: { message: string } | null }>,
  lista: string,
  formulario: string
): Promise<never> {
  const { error } = await write

  if (error) {
    redirect(`${formulario}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(lista)
  redirect(lista)
}
