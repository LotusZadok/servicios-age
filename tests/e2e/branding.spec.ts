import { test, expect } from '@playwright/test'

test('los assets del logo se sirven correctamente', async ({ page }) => {
  for (const path of ['/logo.png', '/logo-mark.png']) {
    const res = await page.request.get(path)
    expect(res.status(), `${path} debería existir`).toBe(200)
    expect(res.headers()['content-type']).toContain('png')
  }
})

// Next genera el <link rel="icon"> a partir de src/app/icon.ico por convención
// del App Router. Si esa convención cambia, el favicon desaparece en silencio;
// este test lo detecta.
test('el head declara un favicon que responde', async ({ page }) => {
  await page.goto('/login')

  const href = await page.locator('link[rel~="icon"]').first().getAttribute('href')
  expect(href, 'debería haber un <link rel="icon"> en el head').toBeTruthy()

  const res = await page.request.get(href!)
  expect(res.status(), `el favicon en ${href} debería servirse`).toBe(200)
})

test('el login muestra el logo de la marca', async ({ page }) => {
  await page.goto('/login')
  const logo = page.getByRole('img', { name: 'Servicios AGE' })
  await expect(logo).toBeVisible()
})

test('el dashboard usa el nombre Servicios AGE', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  await expect(page).toHaveTitle(/Servicios AGE/)
  await expect(page.getByText('Operación de mantenimiento de Servicios AGE')).toBeVisible()
})
