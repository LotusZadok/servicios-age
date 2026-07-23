import { test, expect } from '@playwright/test'

test('staff registra un mantenimiento y aparece en la lista', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/dashboard/maintenances/new')
  await page.getByLabel('Máquina').selectOption({ index: 1 })
  await page.getByLabel('Fecha').fill('2026-07-23')
  await page.getByLabel('Descripción').fill('Cambio de aceite E2E')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page).toHaveURL(/\/dashboard\/maintenances$/)
  await expect(page.getByText('Cambio de aceite E2E').first()).toBeVisible()
})
