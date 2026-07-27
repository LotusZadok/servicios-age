import { test, expect } from '@playwright/test'

test('los assets del logo se sirven correctamente', async ({ page }) => {
  for (const path of ['/logo.svg', '/logo-mark.svg']) {
    const res = await page.request.get(path)
    expect(res.status(), `${path} debería existir`).toBe(200)
    expect(res.headers()['content-type']).toContain('svg')
  }
})
