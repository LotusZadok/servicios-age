import { test, expect } from '@playwright/test'

test('un cliente entra a su portal y no puede ver el dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_CLIENT_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_CLIENT_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // The login -> '/' -> /portal redirect chain can be slow on a cold dev compile.
  await expect(page).toHaveURL(/\/portal/, { timeout: 15000 })
  await expect(page.getByText('Mis máquinas')).toBeVisible()

  // A client cannot reach the internal dashboard; it redirects back to /portal.
  await page.goto('/dashboard/clients')
  await expect(page).toHaveURL(/\/portal/)
})
