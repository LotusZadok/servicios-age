import { test, expect } from '@playwright/test'

// Marcas y tipos de maquinaria comparten componente y server action: la tabla
// sale del segmento de la URL. Esta prueba recorre el CRUD de marcas y luego
// comprueba que la otra ruta resuelve su propia tabla y sus propias etiquetas
// — si el mapa de catálogos se rompiera, las dos mostrarían lo mismo.

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('admin puede crear, editar y archivar una marca', async ({ page }) => {
  const nombre = `Marca CRUD ${Date.now()}`
  const editado = `${nombre} editada`

  await page.goto('/dashboard/brands')
  await page.getByRole('link', { name: 'Nueva marca' }).click()

  await page.getByLabel('Nombre').fill(nombre)
  await page.getByLabel('Descripción').fill('Creada por el E2E')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page).toHaveURL(/\/dashboard\/brands$/)
  await expect(page.getByRole('cell', { name: nombre, exact: true })).toBeVisible()

  await page.getByRole('row', { name: nombre }).getByRole('link', { name: 'Editar' }).click()
  await expect(page.getByRole('heading', { name: 'Editar marca' })).toBeVisible()
  await page.getByLabel('Nombre').fill(editado)
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByRole('cell', { name: editado })).toBeVisible()

  await page.getByRole('row', { name: editado }).getByRole('button', { name: 'Archivar' }).click()

  await expect(page.getByRole('cell', { name: editado })).not.toBeVisible()
})

test('tipos de maquinaria es la otra tabla, no una copia de marcas', async ({ page }) => {
  const nombre = `Tipo CRUD ${Date.now()}`

  await page.goto('/dashboard/machine-types')
  await expect(page.getByRole('heading', { name: 'Tipos de maquinaria' })).toBeVisible()

  await page.getByRole('link', { name: 'Nuevo tipo' }).click()
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page).toHaveURL(/\/dashboard\/machine-types$/)
  await expect(page.getByRole('cell', { name: nombre, exact: true })).toBeVisible()

  // El alta fue a machine_types: en marcas no aparece.
  await page.goto('/dashboard/brands')
  await expect(page.getByRole('cell', { name: nombre, exact: true })).not.toBeVisible()

  await page.goto('/dashboard/machine-types')
  await page.getByRole('row', { name: nombre }).getByRole('button', { name: 'Archivar' }).click()
  await expect(page.getByRole('cell', { name: nombre, exact: true })).not.toBeVisible()
})
