/**
 * Regenera TODAS las capturas de `docs/screenshots/`.
 *
 * Cómo correrlo, de cero:
 *
 *   npx supabase start
 *   npx supabase db reset
 *   npx tsx scripts/seed-admin.ts <correo> <contraseña> "<nombre completo>"
 *   npx tsx scripts/seed-portal-test.ts
 *   npm run dev                        # en otra terminal, escuchando en :3000
 *   npx tsx scripts/screenshots.ts     # sobrescribe docs/screenshots/*.png
 *
 * No es un spec de Playwright a propósito, y no debe correr con `npm run
 * test:e2e`: inflaría el conteo de la batería y fallaría por cosas que no son
 * regresiones —un cambio de copy, un dev server frío—, que es justo el ruido
 * que la batería no puede permitirse.
 *
 * Los datos son los de `seed-admin.ts` y `seed-portal-test.ts`, más lo que este
 * script siembra y vuelve a borrar al terminar. Nunca datos reales de la
 * empresa ni de sus clientes.
 *
 * Los nombres de archivo salen del encabezado de tarea de
 * `docs/manual-usuario.md` que cada imagen ilustra. Al renombrar un encabezado
 * hay que renombrar aquí y volver a correr esto.
 */
process.loadEnvFile('.env.local')

import { chromium, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { createAdminClient } from '../src/lib/supabase/admin-core'

const BASE = 'http://localhost:3000'
const SALIDA = 'docs/screenshots'

// Escritorio, idéntico en todas. Sin capturas móviles: el trabajo responsive
// está pendiente y quedarían obsoletas antes de servir para algo.
const VIEWPORT = { width: 1280, height: 800 }

const admin = createAdminClient()

async function servidorVivo() {
  try {
    const r = await fetch(`${BASE}/login`)
    return r.ok
  } catch {
    return false
  }
}

/** Datos de relleno para que los listados no salgan casi vacíos. */
async function sembrar() {
  const creado = {
    clienteIds: [] as string[],
    sedeIds: [] as string[],
    maquinaIds: [] as string[],
    mantenimientoIds: [] as string[],
    usuarioIds: [] as string[],
  }

  const { data: marca } = await admin.from('brands').select('id').limit(1).single()
  const { data: tipo } = await admin.from('machine_types').select('id').limit(1).single()
  if (!marca || !tipo) throw new Error('faltan marca y tipo: corre scripts/seed-portal-test.ts')

  // Dos clientes de relleno. Nombres inventados a propósito.
  for (const [nombre, sede, maquina] of [
    ['Comercial Delta S.A.', 'Sucursal Este', 'Montacargas D-12'],
    ['Distribuidora Vega', 'Bodega Central', 'Montacargas V-07'],
  ]) {
    const { data: cliente } = await admin
      .from('clients')
      .insert({
        name: nombre,
        email: `contacto@${nombre.split(' ')[0].toLowerCase()}.example`,
        phone: '2222-0000',
        address: 'San José',
      })
      .select('id')
      .single()
    if (!cliente) throw new Error(`no se pudo sembrar el cliente ${nombre}`)
    creado.clienteIds.push(cliente.id)

    const { data: s } = await admin
      .from('locations')
      .insert({ client_id: cliente.id, name: sede, address: 'Calle 4' })
      .select('id')
      .single()
    if (s) creado.sedeIds.push(s.id)

    const { data: m } = await admin
      .from('machines')
      .insert({
        name: maquina,
        model: 'GX-30',
        brand_id: marca.id,
        type_id: tipo.id,
        client_id: cliente.id,
        location_id: s?.id ?? null,
        asset_number: 'INV-0042',
      })
      .select('id')
      .single()
    if (m) creado.maquinaIds.push(m.id)
  }

  // Una cuenta de empleado, para que el listado de usuarios tenga dos filas y
  // el selector de rol se vea en contexto.
  const { data: empleado } = await admin.auth.admin.createUser({
    email: 'empleado.demo@agservicios.local',
    password: `demo-${Date.now()}`,
    email_confirm: true,
  })
  if (empleado?.user) {
    creado.usuarioIds.push(empleado.user.id)
    await admin
      .from('profiles')
      .insert({ id: empleado.user.id, full_name: 'Marta Rojas', role: 'empleado' })
  }

  // La máquina del cliente del portal, que es la que se ve en las capturas del
  // portal y en el formulario de mantenimiento.
  const { data: maquinaPortal } = await admin
    .from('machines')
    .select('id, location_id')
    .eq('serial_number', 'E2E-0001')
    .single()
  if (!maquinaPortal) throw new Error('falta el seed del portal')

  // Una solicitud pendiente: es lo que enciende el contador de la navegación y
  // lo que se ve destacado primero en la lista.
  const { data: solicitud } = await admin
    .from('maintenances')
    .insert({
      machine_id: maquinaPortal.id,
      location_id: maquinaPortal.location_id,
      description: 'La máquina pierde fuerza al levantar carga completa.',
      status: 'solicitado',
      is_corrective: true,
    })
    .select('id')
    .single()
  if (solicitud) creado.mantenimientoIds.push(solicitud.id)

  // Un par de trabajos más, para que la lista y el historial tengan cuerpo.
  for (const m of creado.maquinaIds) {
    const { data: mant } = await admin
      .from('maintenances')
      .insert({
        machine_id: m,
        date: '2026-08-20',
        description: 'Cambio de aceite hidráulico y revisión de mástil.',
        status: 'completado',
        is_corrective: false,
        hour_meter: 2450,
        cost_subtotal: 85000,
        tax_amount: 11050,
        report_ref: 'BOL-1042',
        quote_ref: 'PRO-0311',
      })
      .select('id')
      .single()
    if (mant) creado.mantenimientoIds.push(mant.id)
  }

  const { data: existente } = await admin
    .from('maintenances')
    .select('id')
    .eq('machine_id', maquinaPortal.id)
    .eq('status', 'completado')
    .limit(1)
    .maybeSingle()

  return {
    creado,
    maquinaPortalId: maquinaPortal.id,
    // Un cliente sin acceso al portal: la ficha del que ya lo tiene muestra su
    // estado en vez del formulario, que es justo lo que hay que ilustrar.
    clienteSinAccesoId: creado.clienteIds[0],
    mantenimientoEditableId: existente?.id ?? creado.mantenimientoIds[1],
  }
}

async function limpiar(creado: Awaited<ReturnType<typeof sembrar>>['creado']) {
  for (const id of creado.mantenimientoIds) {
    await admin.from('maintenances').delete().eq('id', id)
  }
  for (const id of creado.maquinaIds) {
    await admin.from('machines').delete().eq('id', id)
  }
  for (const id of creado.sedeIds) {
    await admin.from('locations').delete().eq('id', id)
  }
  for (const id of creado.clienteIds) {
    await admin.from('clients').delete().eq('id', id)
  }
  for (const id of creado.usuarioIds) {
    await admin.auth.admin.deleteUser(id)
  }
}

async function entrar(page: Page, correo: string, contrasena: string) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Correo').fill(correo)
  await page.getByLabel('Contraseña').fill(contrasena)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/\/(dashboard|portal)/)
}

async function salir(page: Page) {
  await page.getByRole('button', { name: 'Salir' }).click()
  await page.waitForURL(/\/login/)
}

async function main() {
  if (!(await servidorVivo())) {
    console.error(`No hay nada escuchando en ${BASE}. Levanta el servidor con "npm run dev".`)
    process.exit(1)
  }

  const correoAdmin = process.env.E2E_ADMIN_EMAIL
  const claveAdmin = process.env.E2E_ADMIN_PASSWORD
  const correoCliente = process.env.E2E_CLIENT_EMAIL
  const claveCliente = process.env.E2E_CLIENT_PASSWORD
  if (!correoAdmin || !claveAdmin || !correoCliente || !claveCliente) {
    console.error('Faltan las variables E2E_* en .env.local.')
    process.exit(1)
  }

  mkdirSync(SALIDA, { recursive: true })
  const datos = await sembrar()

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()

  let n = 0
  async function shot(nombre: string) {
    // La página completa, no sólo lo que entra en el alto del viewport: varios
    // formularios son más largos y cortarlos esconde justo los campos nuevos.
    await page.screenshot({ path: `${SALIDA}/${nombre}.png`, fullPage: true })
    console.log(`  ${String(++n).padStart(2, '0')}  ${nombre}.png`)
  }

  /**
   * Dos arreglos que sólo existen para la foto, no para la aplicación:
   *
   * - `.app-nav` es `position: sticky`, y en una captura de página completa el
   *   navegador la pinta a la altura del scroll, es decir en medio del
   *   formulario. Pasarla a `static` la deja donde el lector espera verla.
   * - El indicador de desarrollo de Next flota sobre la esquina inferior y no
   *   es parte del producto.
   */
  const ESTILOS_DE_CAPTURA = `
    .app-nav { position: static !important; }
    nextjs-portal { display: none !important; }
  `

  async function ir(ruta: string) {
    await page.goto(`${BASE}${ruta}`)
    await page.waitForLoadState('networkidle')
    await page.addStyleTag({ content: ESTILOS_DE_CAPTURA })
  }

  console.log('Capturando:')

  // El login se captura vacío: ninguna credencial visible en la imagen.
  await ir('/login')
  await shot('ingresar-al-sistema')

  await entrar(page, correoAdmin, claveAdmin)

  await ir('/dashboard/maintenances/new')
  await page.getByLabel('Máquina').selectOption({ index: 1 })
  await page.getByLabel('Subtotal').fill('85000')
  await page.getByLabel('Horímetro').fill('2450')
  await page.getByLabel('N.º de boleta o reporte').fill('BOL-1042')
  await page.getByLabel('N.º de proforma').fill('PRO-0311')
  await page.getByLabel('Descripción').fill('Cambio de aceite hidráulico y revisión de mástil.')
  await shot('registrar-un-mantenimiento')

  await ir(`/dashboard/maintenances/${datos.mantenimientoEditableId}/edit`)
  await shot('corregir-un-mantenimiento-ya-registrado')

  await ir('/dashboard/maintenances')
  await shot('atender-una-solicitud-enviada-por-un-cliente')

  await ir('/dashboard/clients/new')
  await shot('registrar-un-cliente-nuevo')

  await ir('/dashboard/locations/new')
  await shot('registrar-una-sede-de-un-cliente')

  await ir('/dashboard/machines/new')
  await shot('registrar-una-maquina')

  await ir(`/dashboard/machines/${datos.maquinaPortalId}/edit`)
  await shot('trasladar-una-maquina-a-otra-tienda')

  await ir('/dashboard/brands/new')
  await shot('registrar-una-marca-o-un-tipo-de-maquinaria')

  await ir('/dashboard/reports')
  await shot('descargar-el-catalogo-completo-para-excel')

  await ir('/dashboard/users/new')
  await shot('crear-una-cuenta-para-alguien-de-la-empresa')

  await ir('/dashboard/users')
  await shot('cambiar-el-rol-de-una-cuenta')

  await ir(`/dashboard/clients/${datos.clienteSinAccesoId}/edit`)
  await shot('dar-acceso-al-portal-a-un-cliente')

  await ir('/dashboard/clients')
  await shot('archivar-un-cliente-es-decir-darlo-de-baja')

  await ir('/dashboard/locations')
  await shot('archivar-una-sede-una-maquina-una-marca-o-un-tipo')

  await salir(page)
  await entrar(page, correoCliente, claveCliente)

  await ir('/portal')
  await shot('ver-mis-maquinas')

  await ir(`/portal/machines/${datos.maquinaPortalId}`)
  await shot('ver-el-historial-de-una-maquina')

  // Sólo la tarjeta: la página entera ya se capturó arriba y repetirla no
  // añade nada.
  const tarjeta = page.locator('section').filter({ hasText: 'Solicitar mantenimiento' }).first()
  await tarjeta.screenshot({ path: `${SALIDA}/solicitar-un-mantenimiento.png` })
  console.log(`  ${String(++n).padStart(2, '0')}  solicitar-un-mantenimiento.png`)

  await browser.close()
  await limpiar(datos.creado)
  console.log(`\n${n} capturas en ${SALIDA}/. Datos de relleno borrados.`)
}

main()
