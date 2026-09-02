import { test, expect } from '@playwright/test'
import { createAdminClient } from '../../src/lib/supabase/admin-core'

/**
 * Un acceso al portal no puede convertirse en cuenta de personal interno.
 *
 * La barrera real es la restricción `profiles_portal_role`, un CHECK de tabla y
 * no una política: la acción que cambia el rol escribe con el cliente de rol de
 * servicio, que evita RLS por diseño. Por eso el intento se hace aquí con la
 * llave de servicio, que es el camino con más privilegios que existe: si ahí
 * falla, falla en todos.
 */
test.describe('escalada de rol sobre un acceso de portal', () => {
  // El perfil sembrado por scripts/seed-portal-test.ts.
  async function perfilDePortal() {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('id, role, client_id, full_name')
      .eq('role', 'cliente')
      .not('client_id', 'is', null)
      .maybeSingle()

    if (error) throw new Error('no se pudo leer el perfil de portal: ' + error.message)
    if (!data) throw new Error('falta el seed del portal: corre scripts/seed-portal-test.ts')
    return data
  }

  test('la base rechaza subir de rol un perfil con client_id', async () => {
    const admin = createAdminClient()
    const perfil = await perfilDePortal()

    const { error } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', perfil.id)

    // Se exige el código 23514 (violación de CHECK) y no un error cualquiera:
    // afirmar sólo `error !== null` pasaría igual con un nombre de columna mal
    // escrito, que es un fallo distinto y no demuestra nada.
    expect(error?.code, error?.message).toBe('23514')

    // Y el rol siguió siendo el que era: el update no pasó a medias.
    const { data: despues } = await admin
      .from('profiles')
      .select('role, client_id')
      .eq('id', perfil.id)
      .single()

    expect(despues?.role).toBe('cliente')
    expect(despues?.client_id).toBe(perfil.client_id)
  })

  test('tampoco deja quitarle el client_id a un perfil cliente', async () => {
    const admin = createAdminClient()
    const perfil = await perfilDePortal()

    // El otro lado de la restricción bidireccional: un perfil 'cliente' sin
    // client_id no apuntaría a ningún cliente y current_client_id() devolvería
    // null para él.
    const { error } = await admin
      .from('profiles')
      .update({ client_id: null })
      .eq('id', perfil.id)

    expect(error?.code, error?.message).toBe('23514')
  })

  test('el listado de usuarios no muestra los accesos de portal', async ({ page }) => {
    const perfil = await perfilDePortal()

    await page.goto('/login')
    await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
    await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.goto('/dashboard/users')

    // Sin esta afirmación, revertir el filtro del listado dejaría pasar la
    // batería entera: la restricción de la base seguiría verde y la fila
    // peligrosa volvería a la pantalla sin que nada avisara.
    await expect(page.getByRole('cell', { name: perfil.full_name })).toHaveCount(0)

    // Y las cuentas internas sí siguen estando, para que la prueba no pase por
    // haberse quedado con un listado vacío. El nombre del admin lo elige quien
    // corre el seed, así que se lee de la base en vez de fijarlo aquí.
    const admin = createAdminClient()
    const { data: internos } = await admin
      .from('profiles')
      .select('full_name')
      .is('client_id', null)
      .order('full_name')

    expect(internos?.length, 'falta el seed del admin').toBeGreaterThan(0)
    await expect(page.getByRole('cell', { name: internos![0].full_name })).toBeVisible()
  })
})
