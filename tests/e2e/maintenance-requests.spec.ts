import { test, expect } from '@playwright/test'

test('un cliente solicita un mantenimiento y el staff lo ve como pendiente', async ({ page }) => {
  // Client requests a maintenance from its machine.
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_CLIENT_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_CLIENT_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/portal/, { timeout: 15000 })

  await page.getByRole('link', { name: /Excavadora E2E/ }).click()
  await expect(page).toHaveURL(/\/portal\/machines\//)

  const descripcion = `Ruido extraño ${Date.now()}`
  await page.getByLabel('¿Qué necesita?').fill(descripcion)
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()

  // The request shows in this machine's history as "solicitado".
  await expect(page.getByRole('cell', { name: descripcion })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'solicitado' }).first()).toBeVisible()

  // Staff sees a pending indicator and a "Solicitado" badge.
  await page.getByRole('button', { name: 'Salir' }).click()
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await expect(page.getByRole('link', { name: /Mantenimientos \(\d+\)/ })).toBeVisible()
  await page.goto('/dashboard/maintenances')
  await expect(page.getByText('Solicitado').first()).toBeVisible()
})
