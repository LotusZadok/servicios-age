# Rebranding a Servicios AGE — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que toda la app use la paleta verde/negro/blanco de Servicios AGE y el nombre nuevo, con el logo como archivo SVG reemplazable.

**Architecture:** Todo el color vive en variables CSS de un solo archivo (`src/app/globals.css`); ningún otro archivo de `src/` tiene un hex hardcodeado, así que la migración de paleta es un cambio localizado. El logo pasa de ser una caja dibujada en CSS a tres archivos SVG versionados. El nombre cambia en siete superficies de código más documentación. Los identificadores técnicos que conservan el nombre viejo se documentan en `AGENTS.md` como decisión deliberada.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Playwright (E2E), Vitest (unit).

**Spec:** `docs/superpowers/specs/2026-07-27-rebranding-servicios-age-design.md`

---

## Contexto para quien implementa

Cosas no obvias de este repo que necesitás saber antes de empezar:

- **El middleware se llama `proxy.ts`, no `middleware.ts`.** Next.js 16 lo renombró. Está en `src/proxy.ts` y exporta una función `proxy`. No lo renombres.
- **`AGENTS.md` tiene un bloque autogenerado** delimitado por `<!-- BEGIN:nextjs-agent-rules -->` y `<!-- END:nextjs-agent-rules -->`. Todo lo que agregues **debe ir después del marcador de cierre**, o se pierde cuando ese bloque se regenere.
- **Los E2E necesitan infraestructura corriendo:** Docker Desktop + Supabase local (`npx supabase start`), y las variables `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`/`E2E_CLIENT_EMAIL`/`E2E_CLIENT_PASSWORD` en `.env.local`. Ya deberían estar configuradas. En PowerShell, el CLI de Supabase necesita Docker en el PATH: `$env:PATH = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;$env:PATH"`.
- **Playwright levanta el dev server solo** (`reuseExistingServer: true`), así que no hace falta `npm run dev` aparte.
- **No renombres** `supabase/config.toml` project_id, ni el email `portal@agservicios.local` en `scripts/seed-portal-test.ts`, ni los documentos en `docs/superpowers/specs/` y `plans/`. Es deliberado y está justificado en el spec. La Task 6 lo documenta.

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `src/app/globals.css` | Todos los tokens de color y clases de componente | Modificar |
| `public/logo.svg` | Lockup completo, para el login | Crear |
| `public/logo-mark.svg` | Marca cuadrada, para las navs | Crear |
| `src/app/icon.svg` | Favicon (convención de metadata de App Router) | Crear |
| `src/app/favicon.ico` | Favicon viejo | Borrar |
| `public/{file,globe,next,vercel,window}.svg` | Sobrantes del starter, sin referencias | Borrar |
| `src/proxy.ts` | Matcher del middleware | Modificar (1 línea) |
| `src/app/layout.tsx` | Título del documento | Modificar |
| `src/app/dashboard/layout.tsx` | Marca de la nav interna | Modificar |
| `src/app/portal/layout.tsx` | Marca de la nav del portal | Modificar |
| `src/app/login/page.tsx` | Lockup y encabezado | Modificar |
| `src/app/dashboard/page.tsx` | Texto de bienvenida | Modificar |
| `src/app/portal/page.tsx` | Texto del estado vacío | Modificar |
| `src/app/api/reports/catalog/route.ts` | Nombre del CSV | Modificar |
| `tests/e2e/branding.spec.ts` | Regresión de marca y assets | Crear |
| `README.md`, `docs/manual-usuario.md`, `package.json`, `AGENTS.md` | Documentación | Modificar |

---

## Task 1: Paleta de color

Los tokens son la base: todo lo demás se apoya en ellos. Al terminar esta task la app ya se ve verde, aunque siga diciendo "AGServicios".

**Nota sobre TDD:** esta task no lleva test automatizado. Un test que afirme "esta variable CSS vale este hex" solo reformula el código sin verificar nada real, y la regresión que importa acá es visual. Se verifica con el build y con inspección en el navegador. Las tasks 2, 3 y 4 sí llevan tests, porque ahí sí hay comportamiento observable (assets que responden, texto que aparece).

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Reemplazar el bloque `:root`**

Sustituí las líneas 8–45 (desde `:root {` hasta el `}` que cierra, incluido el puente de tokens de Tailwind) por:

```css
:root {
  /* Neutros — blanco y negro puros */
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-2: #f6f7f6;
  --ink: #000000;
  --ink-soft: #383d39;
  --muted: #6b7280;
  --line: #e5e7e5;
  --line-strong: #d1d5d1;

  /* Acento de marca — verde Servicios AGE */
  --accent: #16a045;
  --accent-ink: #0d7a33;
  --accent-weak: #e7f6ec;
  --danger: #a92318;
  --danger-weak: #f7e6e3;

  /* Colores de estado de mantenimiento */
  --st-req: #9a4d0f;
  --st-req-weak: #fbeee2;
  --st-prog: #2b5d9c;
  --st-prog-weak: #e7eef7;
  --st-proc: #8a6300;
  --st-proc-weak: #f5eed9;
  --st-done: var(--accent-ink);
  --st-done-weak: var(--accent-weak);
  --st-cancel: var(--muted);
  --st-cancel-weak: #f0f1f0;

  --ring: 0 0 0 3px rgba(22, 160, 69, 0.28);
  --radius: 10px;
  --radius-sm: 7px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.22);

  /* Puente de tokens de Tailwind */
  --background: var(--bg);
  --foreground: var(--ink);
}
```

**Por qué dos verdes:** `#16a045` sobre blanco da 3.41:1 de contraste — cumple el mínimo 3:1 de WCAG para componentes de interfaz (anillo de foco, subrayado de nav) pero **falla** el 4.5:1 que exige el texto. `--accent-ink` (`#0d7a33`) da 5.46:1 y cumple AA. Usá `--accent` solo para elementos no textuales y `--accent-ink` para todo texto verde. No inviertas esto.

- [ ] **Step 2: Quitar la retícula del `body`**

En la regla `body`, borrá las tres líneas de `background-image` (los dos `linear-gradient`), el comentario `/* faint engineering grid */` y la línea `background-size: 30px 30px;`. La regla queda:

```css
body {
  background-color: var(--bg);
  color: var(--ink);
  font-family: var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

- [ ] **Step 3: Apuntar el chip `solicitado` a su token propio**

Buscá la línea de `.status-solicitado` y cambiala para que use `--st-req` en vez de heredar el acento de marca:

```css
.status-solicitado { color: var(--st-req); background: var(--st-req-weak); }
```

Las otras cuatro líneas de `.status-*` no se tocan: ya leen de variables `--st-*` que Step 1 redefinió.

- [ ] **Step 4: Actualizar el encabezado del archivo**

Línea 4, dentro del comentario de bloque:

```css
   Servicios AGE — sistema de diseño
   Blanco y negro con acento verde de marca.
```

- [ ] **Step 5: Verificar que compila y se ve bien**

Run: `npm run build`
Expected: `Compiled successfully`, sin errores de CSS.

Después: `npm run dev`, abrí `http://localhost:3000/login` y confirmá visualmente:
- Fondo blanco liso, sin retícula.
- Al enfocar el campo "Correo", el anillo de foco es **verde**, no ámbar.
- El botón "Entrar" es negro con texto blanco.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(ui): adopt the Servicios AGE color palette"
```

---

## Task 2: Assets del logo

**Files:**
- Create: `public/logo.svg`, `public/logo-mark.svg`, `src/app/icon.svg`
- Create: `tests/e2e/branding.spec.ts`
- Delete: `src/app/favicon.ico`, `public/{file,globe,next,vercel,window}.svg`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/e2e/branding.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('los assets del logo se sirven correctamente', async ({ page }) => {
  for (const path of ['/logo.svg', '/logo-mark.svg']) {
    const res = await page.request.get(path)
    expect(res.status(), `${path} debería existir`).toBe(200)
    expect(res.headers()['content-type']).toContain('svg')
  }
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx playwright test tests/e2e/branding.spec.ts`
Expected: FAIL — `/logo.svg debería existir` recibe 404.

- [ ] **Step 3: Crear `public/logo-mark.svg`**

Aproximación vectorial del glifo: barra negra superior, barras verdes escalonadas, flecha blanca ascendente.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Servicios AGE">
  <rect x="4" y="7" width="56" height="15" fill="#000000"/>
  <rect x="20" y="27" width="40" height="13" fill="#16a045"/>
  <rect x="4" y="45" width="56" height="13" fill="#16a045"/>
  <path d="M10 51 L28 33 L36 41 L50 27" fill="none" stroke="#ffffff" stroke-width="7"/>
  <path d="M56 20 L56 35 L41 20 Z" fill="#ffffff"/>
</svg>
```

- [ ] **Step 4: Crear `src/app/icon.svg`**

Mismo dibujo, pero sobre fondo negro para que se lea en la pestaña del navegador. `src/app/icon.svg` es la convención de metadata del App Router: Next lo detecta y genera el `<link rel="icon">` automáticamente, sin configuración.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Servicios AGE">
  <rect width="64" height="64" rx="12" fill="#000000"/>
  <rect x="10" y="16" width="44" height="10" fill="#ffffff"/>
  <rect x="22" y="30" width="32" height="9" fill="#16a045"/>
  <rect x="10" y="43" width="44" height="9" fill="#16a045"/>
  <path d="M15 46 L29 32 L35 38 L46 27" fill="none" stroke="#ffffff" stroke-width="5"/>
  <path d="M50 22 L50 33 L39 22 Z" fill="#ffffff"/>
</svg>
```

- [ ] **Step 5: Crear `public/logo.svg`**

Lockup completo para el login. El texto usa la familia tipográfica de la app con respaldo genérico, para que no dependa de que una fuente concreta esté instalada.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 210" role="img" aria-label="Servicios AGE">
  <text x="210" y="40" text-anchor="middle" font-family="IBM Plex Sans, Segoe UI, sans-serif"
        font-size="30" font-weight="500" letter-spacing="15" fill="#000000">SERVICIOS</text>
  <text x="20" y="170" font-family="IBM Plex Sans, Segoe UI, sans-serif"
        font-size="130" font-weight="700" letter-spacing="-2" fill="#000000">AG</text>
  <g transform="translate(268, 78) scale(1.45)">
    <rect x="4" y="7" width="56" height="15" fill="#000000"/>
    <rect x="20" y="27" width="40" height="13" fill="#16a045"/>
    <rect x="4" y="45" width="56" height="13" fill="#16a045"/>
    <path d="M10 51 L28 33 L36 41 L50 27" fill="none" stroke="#ffffff" stroke-width="7"/>
    <path d="M56 20 L56 35 L41 20 Z" fill="#ffffff"/>
  </g>
</svg>
```

- [ ] **Step 6: Borrar los assets viejos**

```bash
git rm src/app/favicon.ico public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

Los cinco SVG del starter no los referencia ningún archivo (verificado por búsqueda). `favicon.ico` lo reemplaza `src/app/icon.svg`.

- [ ] **Step 7: Correr el test para verificar que pasa**

Run: `npx playwright test tests/e2e/branding.spec.ts`
Expected: PASS.

- [ ] **Step 8: Confirmar que Next detecta el favicon**

Esta es la única parte de la task que depende de una convención del framework en vez de un archivo estático, y `AGENTS.md` advierte que esta versión de Next puede diferir de lo que conocés. Verificalo en vez de asumirlo.

Con `npm run dev` corriendo, abrí `http://localhost:3000/login`, inspeccioná el `<head>` y buscá un `<link rel="icon">`. Debería apuntar a `/icon.svg` (posiblemente con un query de cache-busting).

Si **no** aparece: la convención cambió en esta versión. Consultá `node_modules/next/dist/docs/` para ver cómo se declaran los iconos, y si hace falta declaralo explícitamente en el `metadata` de `src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: "AGServicios",
  description: "Herramienta interna de gestión de maquinaria",
  icons: { icon: "/icon.svg" },
};
```

(El `title` se cambia en la Task 4; dejalo como está por ahora.) Si tomás este camino, movés `icon.svg` de `src/app/` a `public/`.

- [ ] **Step 9: Revisar el logo a ojo**

Abrí `http://localhost:3000/logo.svg` y `http://localhost:3000/logo-mark.svg` en el navegador. Confirmá que se ven como una marca coherente (barra negra arriba, barras verdes, flecha blanca ascendente). **Son una aproximación del original**; si quedan desalineados, ajustá las coordenadas — no hay valores sagrados acá.

- [ ] **Step 10: Commit**

```bash
git add public/logo.svg public/logo-mark.svg src/app/icon.svg tests/e2e/branding.spec.ts
git commit -m "feat(ui): add Servicios AGE logo assets, drop starter SVGs"
```

---

## Task 3: Cablear el logo en la interfaz

`.brand-mark` deja de ser una caja CSS con las letras `AG` y pasa a contener un `<img>`.

**Files:**
- Modify: `src/app/globals.css`, `src/app/dashboard/layout.tsx`, `src/app/portal/layout.tsx`, `src/app/login/page.tsx`, `src/proxy.ts`
- Modify: `tests/e2e/branding.spec.ts`

- [ ] **Step 1: Ampliar el test**

Agregá este test al final de `tests/e2e/branding.spec.ts`:

```ts
test('el login muestra el logo de la marca', async ({ page }) => {
  await page.goto('/login')
  const logo = page.getByRole('img', { name: 'Servicios AGE' })
  await expect(logo).toBeVisible()
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx playwright test tests/e2e/branding.spec.ts -g "logo de la marca"`
Expected: FAIL — no existe ningún elemento con rol `img` y ese nombre accesible (hoy la marca es un `<span>` con texto "AG").

- [ ] **Step 3: Convertir `.brand-mark` en contenedor de imagen**

En `src/app/globals.css`, reemplazá la regla `.brand-mark` completa por:

```css
.brand-mark {
  width: 1.7rem;
  height: 1.7rem;
  display: block;
  flex-shrink: 0;
}
```

Se van `border-radius`, `background`, `color`, `display: grid`, `place-items`, `font-size`, `font-weight` y el `box-shadow` interior: todos existían para dibujar la caja `AG`, que ya no está.

- [ ] **Step 4: Usar el logo en la nav del dashboard**

En `src/app/dashboard/layout.tsx`, reemplazá el bloque de la marca (líneas 25–28):

```tsx
<span className="brand shrink-0">
  <img src="/logo-mark.svg" alt="Servicios AGE" className="brand-mark" />
  Servicios AGE
</span>
```

- [ ] **Step 5: Usar el logo en la nav del portal**

En `src/app/portal/layout.tsx`, reemplazá el bloque de la marca (líneas 11–14):

```tsx
<span className="brand shrink-0">
  <img src="/logo-mark.svg" alt="Servicios AGE" className="brand-mark" />
  Portal
</span>
```

- [ ] **Step 6: Usar el lockup completo en el login**

En `src/app/login/page.tsx`, reemplazá el encabezado (líneas 13–21):

```tsx
<div className="mb-6 flex flex-col items-center gap-3 text-center">
  <img src="/logo.svg" alt="Servicios AGE" className="h-20 w-auto" />
  <p className="eyebrow">Acceso interno</p>
</div>
```

El `<h1>` con el nombre se va: el lockup ya contiene el nombre de la empresa, y repetirlo hace que un lector de pantalla lo anuncie dos veces.

- [ ] **Step 7: Excluir los SVG del middleware**

En `src/proxy.ts`, línea 48:

```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|logo.svg|logo-mark.svg).*)'],
```

**Por qué:** todo lo que entra al proxy ejecuta `supabase.auth.getUser()`, que es una llamada de red. Por eso `favicon.ico` ya estaba excluido. Sin esto, cada carga de página paga esa latencia también por el logo. No es un bug de correctitud — el proxy solo redirige en `/dashboard` y `/portal`, así que los assets se servirían igual — sino latencia evitable.

- [ ] **Step 8: Correr el test para verificar que pasa**

Run: `npx playwright test tests/e2e/branding.spec.ts`
Expected: PASS, los dos tests.

- [ ] **Step 9: Confirmar que las navs no se rompieron**

Run: `npx playwright test`
Expected: PASS, toda la suite. Esto cubre que el `<img>` nuevo no desacomodó el layout de la nav en dashboard ni en portal.

- [ ] **Step 10: Commit**

```bash
git add src/app/globals.css src/app/dashboard/layout.tsx src/app/portal/layout.tsx src/app/login/page.tsx src/proxy.ts tests/e2e/branding.spec.ts
git commit -m "feat(ui): use the logo asset for the brand mark"
```

---

## Task 4: El nombre en la interfaz

**Ya hecho en la Task 3:** las navs de `dashboard/layout.tsx` y `portal/layout.tsx` y el encabezado de `login/page.tsx` cambiaron de nombre ahí, porque el mismo edit que mete el `<img>` toca el texto. Esta task cubre las cuatro superficies restantes.

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/dashboard/page.tsx`, `src/app/portal/page.tsx`, `src/app/api/reports/catalog/route.ts`
- Modify: `tests/e2e/branding.spec.ts`

- [ ] **Step 1: Escribir el test que falla**

Agregá al final de `tests/e2e/branding.spec.ts`:

```ts
test('el dashboard usa el nombre Servicios AGE', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  await expect(page.getByText('Servicios AGE')).toBeVisible()
  await expect(page).toHaveTitle(/Servicios AGE/)
  await expect(page.getByText('AGServicios')).toHaveCount(0)
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx playwright test tests/e2e/branding.spec.ts -g "nombre Servicios AGE"`
Expected: FAIL en `toHaveTitle` — el título sigue siendo `AGServicios`.

- [ ] **Step 3: Cambiar el título del documento**

`src/app/layout.tsx`, línea 18:

```tsx
  title: "Servicios AGE",
```

- [ ] **Step 4: Cambiar el texto de bienvenida**

`src/app/dashboard/page.tsx`, línea 23:

```tsx
        Gestión de clientes, máquinas y catálogo de Servicios AGE.
```

- [ ] **Step 5: Cambiar el texto del estado vacío del portal**

`src/app/portal/page.tsx`, línea 41:

```tsx
              Cuando el equipo de Servicios AGE te asigne una, aparecerá aquí.
```

- [ ] **Step 6: Cambiar el nombre del CSV**

`src/app/api/reports/catalog/route.ts`, línea 65:

```ts
      'Content-Disposition': 'attachment; filename="catalogo-servicios-age.csv"',
```

- [ ] **Step 7: Correr el test para verificar que pasa**

Run: `npx playwright test tests/e2e/branding.spec.ts`
Expected: PASS, los tres tests.

- [ ] **Step 8: Commit**

```bash
git add src/app/layout.tsx src/app/dashboard/page.tsx src/app/portal/page.tsx src/app/api/reports/catalog/route.ts tests/e2e/branding.spec.ts
git commit -m "feat: rename the app to Servicios AGE across the UI"
```

---

## Task 5: Documentación y metadatos

**Files:**
- Modify: `README.md`, `docs/manual-usuario.md`, `package.json`, `package-lock.json`

- [ ] **Step 1: Actualizar el título del README**

`README.md`, línea 1:

```markdown
# Servicios AGE — Herramienta interna (Fase 1)
```

La línea 5 menciona `AGServicios-main`, que es el **repositorio original del proyecto de curso**. Ese es un nombre propio histórico y **no se cambia**.

- [ ] **Step 2: Actualizar el título del manual**

`docs/manual-usuario.md`, línea 1:

```markdown
# Manual de usuario — Servicios AGE
```

Es la única aparición del nombre en ese archivo (verificado por búsqueda).

- [ ] **Step 3: Renombrar el paquete**

`package.json`, línea 2:

```json
  "name": "servicios-age-web",
```

- [ ] **Step 4: Sincronizar el lockfile**

Run: `npm install --package-lock-only`
Expected: `package-lock.json` actualiza el campo `name` en dos lugares, sin cambios en las dependencias.

Verificá que solo cambió el nombre: `git diff --stat package-lock.json` debería mostrar unas pocas líneas, no cientos. Si muestra cientos, alguien actualizó dependencias sin querer — revertí con `git checkout package-lock.json` y volvé a intentar.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/manual-usuario.md package.json package-lock.json
git commit -m "docs: rename to Servicios AGE in docs and package metadata"
```

---

## Task 6: Registrar el carve-out de nombres

Sin esto, quien abra el proyecto en seis meses encuentra `AGServicios` en `config.toml` y no sabe si es un error o algo intencional. Esta task convierte el residuo en decisión documentada.

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Agregar la sección "Marca"**

Añadí esto a `AGENTS.md` **después de la línea `<!-- END:nextjs-agent-rules -->`**. Ese bloque es autogenerado; cualquier cosa que pongas dentro se pierde al regenerarlo.

```markdown

# Marca

La empresa se llama **Servicios AGE**. Todo texto visible al usuario usa ese nombre.

El logo son tres SVG: `public/logo.svg` (lockup, login), `public/logo-mark.svg`
(marca cuadrada, navs) y `src/app/icon.svg` (favicon). Son una recreación
aproximada; reemplazar esos archivos actualiza toda la app sin tocar código.
Si agregás o renombrás un asset de marca, acordate de excluirlo en el `matcher`
de `src/proxy.ts`, o cada petición pagará una llamada de auth a Supabase.

Todo el color vive en `src/app/globals.css`. Verde de marca `#16a045` para
elementos **no textuales** (foco, subrayado de nav, iconos); `#0d7a33` para
**texto** verde. El primero da 3.41:1 sobre blanco y no cumple AA para texto;
el segundo da 5.46:1 y sí.

## El nombre anterior era AGServicios

Sobrevive a propósito en identificadores técnicos que no ve el usuario y cuyo
cambio rompería entornos. **No son errores. No los renombres.**

- `supabase/config.toml` → `project_id = "AGServicios-web"`: nombra los
  contenedores Docker locales. Cambiarlo hace que el CLI levante contenedores
  vacíos y huérfane el volumen con los datos sembrados.
- `scripts/seed-portal-test.ts` → `portal@agservicios.local`: cuenta ya sembrada.
  Editarlo no la renombra, crea una segunda casi idéntica, y además obliga a
  cambiar `E2E_CLIENT_EMAIL` en `.env.local` en sincronía.
- `docs/superpowers/specs/` y `plans/`: registros fechados. Describen qué se
  decidió en esa fecha; editarlos retroactivamente destruye su valor como
  registro.
- `AGServicios-main`: nombre propio del repositorio original (Android/Flask/SQL
  Server) que este proyecto reemplaza.
- El nombre del repositorio y el historial de git.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: record the Servicios AGE brand and the legacy-name carve-out"
```

---

## Task 7: Verificación final

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: sin errores.

Si ESLint se queja de `<img>` sugiriendo `next/image`: es esperable y aceptable acá. Un SVG estático de tamaño fijo no gana nada con la optimización de `next/image`, y `next/image` sobre SVG requiere configuración extra. Silenciá la regla en esas líneas con `{/* eslint-disable-next-line @next/next/no-img-element */}` en vez de reestructurar.

- [ ] **Step 2: Tests unitarios**

Run: `npm run test:unit`
Expected: PASS. No deberían verse afectados — cubren permisos y lógica de mantenimientos, nada de presentación.

- [ ] **Step 3: Build de producción**

Run: `npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 4: Suite E2E completa**

Run: `npm run test:e2e`
Expected: PASS, todos los archivos (`auth`, `clients-crud`, `maintenance-requests`, `maintenances`, `portal`, `branding`).

- [ ] **Step 5: Buscar restos del nombre viejo**

En PowerShell:

```powershell
Select-String -Pattern "AGServicios" -Path src\*,README.md,docs\manual-usuario.md,package.json -Recurse
```

En Git Bash: `git grep -n "AGServicios" -- src README.md docs/manual-usuario.md package.json`

Expected: **cero resultados**. Cualquier aparición en `src/` o en esos tres archivos es algo que se escapó.

Después, confirmá que el carve-out sigue intacto (estas **sí** deben aparecer):
`supabase/config.toml`, `scripts/seed-portal-test.ts`, `docs/superpowers/`, `README.md:5` (`AGServicios-main`).

- [ ] **Step 6: Revisión visual**

Con `npm run dev` corriendo, revisá las tres pantallas y capturá cada una:

1. **`/login`** — lockup del logo, fondo blanco liso, foco verde en los inputs, botón negro.
2. **`/dashboard`** (como admin) — marca en la nav, subrayado verde en la pestaña activa, tablas legibles, flecha verde al pasar el mouse sobre las tarjetas.
3. **`/dashboard/maintenances`** — **los cinco chips de estado**. Este es el punto de revisión más importante: confirmá que `solicitado` (ámbar) y `completado` (verde) se distinguen bien, y que `solicitado` y `en_proceso` —los dos únicos cálidos de la paleta— no se confunden entre sí. Si se confunden, separá más `--st-req` de `--st-proc`.
4. **`/portal`** (como cliente) — marca en la nav, tarjetas de máquinas, estado vacío.

Confirmá que **no queda ningún ámbar** del acento viejo (`#bf5415`) fuera de los chips de estado.

- [ ] **Step 7: Commit de cualquier ajuste**

Si la revisión visual obligó a retocar colores o coordenadas del SVG:

```bash
git add -A
git commit -m "fix(ui): tune brand colors and logo geometry after visual review"
```

---

## Notas de despliegue

- Sin migraciones de base de datos. Sin cambios de infraestructura. Sin variables de entorno nuevas.
- Se despliega solo en Vercel al hacer push a `master`.
- Después del deploy, revisá el favicon en producción: los navegadores cachean favicons con fuerza, así que probá en una ventana privada.
