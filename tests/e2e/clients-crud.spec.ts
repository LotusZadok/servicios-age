import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('admin puede crear, editar y eliminar un cliente', async ({ page }) => {
  await page.goto('/dashboard/clients')
  await page.getByRole('link', { name: 'Nuevo cliente' }).click()

  await page.getByLabel('Nombre').fill('Cliente de prueba')
  await page.getByLabel('Correo').fill('prueba@example.com')
  await page.getByLabel('Teléfono').fill('555-0000')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText('Cliente de prueba')).toBeVisible()

  await page
    .getByRole('row', { name: /Cliente de prueba/ })
    .getByRole('link', { name: 'Editar' })
    .click()
  await page.getByLabel('Nombre').fill('Cliente editado')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText('Cliente editado')).toBeVisible()

  await page
    .getByRole('row', { name: /Cliente editado/ })
    .getByRole('button', { name: 'Archivar' })
    .click()

  await expect(page.getByText('Cliente editado')).not.toBeVisible()
})
