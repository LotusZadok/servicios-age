import { test, expect } from '@playwright/test'

test('staff registra un mantenimiento y aparece en la lista', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  const descripcion = `Cambio de aceite E2E ${Date.now()}`

  await page.goto('/dashboard/maintenances/new')
  await page.getByLabel('Máquina').selectOption({ label: 'Excavadora E2E' })

  // Al elegir la máquina se prellena su sede actual, pero queda editable.
  const sede = page.getByLabel('Sede donde se atendió (opcional)')
  await expect(sede).toHaveValue(/.+/)
  await expect(sede.locator('option:checked')).toHaveText('Sede Central E2E')

  await page.getByLabel('Fecha').fill('2026-07-23')
  await page.getByLabel('Horímetro').fill('1350')

  // El impuesto se propone al 13 % del subtotal.
  await page.getByLabel('Subtotal').fill('100000')
  await expect(page.getByLabel('Impuesto')).toHaveValue('13000')
  await expect(page.getByText('Total:')).toContainText('113000')

  // ...pero es editable, y una vez tocado deja de recalcularse.
  await page.getByLabel('Impuesto').fill('0')
  await page.getByLabel('Subtotal').fill('200000')
  await expect(page.getByLabel('Impuesto')).toHaveValue('0')

  await page.getByLabel('N.º de boleta o reporte').fill('BOL-999')
  await page.getByLabel('Descripción').fill(descripcion)
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page).toHaveURL(/\/dashboard\/maintenances$/)
  const fila = page.getByRole('row', { name: new RegExp(descripcion) })
  await expect(fila).toBeVisible()
  await expect(fila).toContainText('Sede Central E2E')
  await expect(fila).toContainText('1350')
  // cost_total es una columna generada: 200000 + 0.
  await expect(fila).toContainText('200000')
})
