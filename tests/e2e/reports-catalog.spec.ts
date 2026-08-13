import { test, expect } from '@playwright/test'

test('el CSV del catálogo incluye sede, activo, horímetro y desglose de costo', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  const res = await page.request.get('/api/reports/catalog')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/csv')
  const csv = await res.text()

  expect(csv).toContain('# Sedes')
  expect(csv).toContain('# Mantenimientos')
  expect(csv).toContain('"Sede Central E2E"')

  // La máquina sembrada trae serie y número de activo.
  expect(csv).toContain('"ACT-E2E-1"')

  // El mantenimiento sembrado trae horímetro y costo desglosado; el total sale
  // de la columna generada (50000 + 6500). Los numeric llegan como números
  // JSON, así que se exportan sin ceros de relleno: la hoja de cálculo los
  // lee como cantidades, no como texto.
  const fila = csv.split('\n').find((l) => l.includes('Mantenimiento inicial E2E'))
  expect(fila, 'debería exportarse el mantenimiento sembrado').toBeTruthy()
  expect(fila).toContain('"1200"')
  expect(fila).toContain('"50000"')
  expect(fila).toContain('"6500"')
  expect(fila).toContain('"56500"')
  expect(fila).toContain('"BOL-E2E-1"')
  expect(fila).toContain('"PRO-E2E-1"')
})

// El escape contra inyección de fórmulas es lo que impide que un nombre de
// cliente como "=cmd|..." se ejecute al abrir el CSV en Excel. Se verifica con
// una sede real porque las sedes son texto libre que escribe el staff.
test('el CSV neutraliza fórmulas en los campos de texto', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  const nombre = `=1+1 sede ${Date.now()}`
  await page.goto('/dashboard/locations/new')
  await page.getByLabel('Cliente').selectOption({ index: 1 })
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page).toHaveURL(/\/dashboard\/locations$/)

  const csv = await (await page.request.get('/api/reports/catalog')).text()
  expect(csv).toContain(`"'${nombre}"`)
  expect(csv).not.toContain(`"${nombre}"`)

  // Se archiva para no dejar residuo en la lista de sedes.
  await page.getByRole('row', { name: nombre }).getByRole('button', { name: 'Archivar' }).click()
})
