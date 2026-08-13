import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '../../src/lib/supabase/admin-core'

test.describe('staff', () => {

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('admin puede crear, editar y archivar una sede', async ({ page }) => {
  const nombre = `Sede de prueba ${Date.now()}`

  await page.goto('/dashboard/locations')
  await page.getByRole('link', { name: 'Nueva sede' }).click()

  await page.getByLabel('Cliente').selectOption({ index: 1 })
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByLabel('Dirección').fill('Calle 1')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page).toHaveURL(/\/dashboard\/locations$/)
  await expect(page.getByRole('cell', { name: nombre })).toBeVisible()

  const editado = `${nombre} editada`
  await page.getByRole('row', { name: nombre }).getByRole('link', { name: 'Editar' }).click()
  await page.getByLabel('Nombre').fill(editado)
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByRole('cell', { name: editado })).toBeVisible()

  await page.getByRole('row', { name: editado }).getByRole('button', { name: 'Archivar' }).click()

  await expect(page.getByRole('cell', { name: editado })).not.toBeVisible()
})

test('el select de sede de una máquina sólo ofrece las sedes de su cliente', async ({ page }) => {
  await page.goto('/dashboard/machines/new')

  const sede = page.getByLabel('Sede actual (opcional)')
  // Sin cliente dueño no hay sedes que elegir.
  await expect(sede).toBeDisabled()

  await page.getByLabel('Cliente dueño (opcional)').selectOption({ label: 'Cliente Portal Test' })
  await expect(sede).toBeEnabled()
  await expect(sede.getByRole('option', { name: 'Sede Central E2E' })).toBeAttached()

  // Al volver a "sin asignar" la sede se limpia: ya no aplica.
  await page.getByLabel('Cliente dueño (opcional)').selectOption('')
  await expect(sede).toHaveValue('')
})

})

// Las sedes son la primera tabla de Fase 4 con datos de un cliente dentro, así
// que su aislamiento se prueba contra la base y no contra la interfaz: el
// portal no tiene pantalla de sedes, y lo que hay que demostrar es que la
// política RLS aguanta aunque alguien hable con PostgREST directamente.
test.describe('aislamiento del portal', () => {
  const sedeAjena = `Sede Ajena ${Date.now()}`
  let clienteAjenoId: string
  let sedeAjenaId: string

  // Un segundo cliente, con sede propia, que el usuario del portal no debería
  // poder ver nunca. Se crea con la llave de servicio (salta RLS) porque el
  // punto de la prueba es leerla desde el otro lado, no crearla.
  test.beforeAll(async () => {
    const admin = createAdminClient()

    const { data: cliente, error: cErr } = await admin
      .from('clients')
      .insert({ name: `Cliente Ajeno ${Date.now()}` })
      .select('id')
      .single()
    if (cErr || !cliente) throw new Error('no se pudo crear el cliente ajeno: ' + cErr?.message)
    clienteAjenoId = cliente.id

    const { data: sede, error: sErr } = await admin
      .from('locations')
      .insert({ client_id: clienteAjenoId, name: sedeAjena, address: 'Calle Ajena' })
      .select('id')
      .single()
    if (sErr || !sede) throw new Error('no se pudo crear la sede ajena: ' + sErr?.message)
    sedeAjenaId = sede.id
  })

  test.afterAll(async () => {
    const admin = createAdminClient()
    if (sedeAjenaId) await admin.from('locations').delete().eq('id', sedeAjenaId)
    if (clienteAjenoId) await admin.from('clients').delete().eq('id', clienteAjenoId)
  })

  // Sesión de cliente con la llave anónima: exactamente los privilegios que
  // tiene el navegador del portal, sin la aplicación de por medio.
  async function sesionDeCliente() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.E2E_CLIENT_EMAIL!,
      password: process.env.E2E_CLIENT_PASSWORD!,
    })
    if (error) throw new Error('no se pudo iniciar sesión como cliente: ' + error.message)
    return supabase
  }

  test('un usuario del portal solo lee las sedes de su propio cliente', async () => {
    const supabase = await sesionDeCliente()

    const { data, error } = await supabase.from('locations').select('id, name')

    // RLS filtra, no falla: la consulta responde bien y devuelve menos filas.
    expect(error).toBeNull()
    expect(data).toBeTruthy()

    const nombres = (data ?? []).map((l) => l.name)
    expect(nombres).toContain('Sede Central E2E')
    expect(nombres).not.toContain(sedeAjena)

    // Y tampoco por id directo, que es el intento obvio si alguien lo adivina.
    const { data: directa } = await supabase
      .from('locations')
      .select('id')
      .eq('id', sedeAjenaId)
      .maybeSingle()
    expect(directa).toBeNull()
  })

  test('un usuario del portal no puede insertar sedes', async () => {
    const supabase = await sesionDeCliente()

    // No hay política de inserción para clientes: las sedes las administra el
    // staff. Ni siquiera para su propio cliente.
    const { data: propias } = await supabase.from('locations').select('client_id').limit(1)
    const clientePropio = propias?.[0]?.client_id
    expect(clientePropio, 'el cliente del portal debería tener al menos una sede').toBeTruthy()

    // Se exige el código 42501 y no un error cualquiera: así la prueba no
    // pasaría por accidente si algún día falla por un nombre de columna mal
    // escrito en vez de por la política.
    const { error: propioErr } = await supabase
      .from('locations')
      .insert({ client_id: clientePropio!, name: `Intento propio ${Date.now()}` })
    expect(propioErr?.code, propioErr?.message).toBe('42501')

    const { error: ajenoErr } = await supabase
      .from('locations')
      .insert({ client_id: clienteAjenoId, name: `Intento ajeno ${Date.now()}` })
    expect(ajenoErr?.code, ajenoErr?.message).toBe('42501')
  })
})
