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
| `public/logo.png` | Lockup completo (494×240), para el login | Crear |
| `public/logo-mark.png` | Glifo de la E (78×96), para las navs | Crear |
| `src/app/icon.ico` | Favicon multitamaño 16/32/48 (convención de App Router) | Crear |
| `src/app/apple-icon.png` | Icono de app 180×180 con la palabra AGE | Crear |
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
  /* Neutrals — pure black and white */
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-2: #f6f7f6;
  --ink: #000000;
  --ink-soft: #383d39;
  --muted: #6b7280;
  --line: #e5e7e5;
  --line-strong: #d1d5d1;

  /* Brand accent — Servicios AGE green.
     --accent is 3.41:1 on white: OK for non-text UI (focus ring, nav underline),
     NOT for text. Use --accent-ink (5.46:1) for anything that renders as text. */
  --accent: #16a045;
  --accent-ink: #0d7a33;
  --accent-weak: #e7f6ec;
  --danger: #a92318;
  --danger-weak: #f7e6e3;

  /* Maintenance status colors */
  --st-req: #9a4d0f;
  --st-req-weak: #fbeee2;
  --st-prog: #2b5d9c;
  --st-prog-weak: #e7eef7;
  --st-proc: #8a6300;
  --st-proc-weak: #f5eed9;
  --st-done: var(--accent-ink);
  --st-done-weak: var(--accent-weak);
  --st-cancel: #5b6270;
  --st-cancel-weak: #f0f1f0;

  --ring: 0 0 0 3px rgba(22, 160, 69, 0.28);
  --radius: 10px;
  --radius-sm: 7px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.22);

  /* Tailwind token bridge */
  --background: var(--bg);
  --foreground: var(--ink);
}
```

**Por qué dos verdes:** `#16a045` sobre blanco da 3.41:1 de contraste — cumple el mínimo 3:1 de WCAG para componentes de interfaz (anillo de foco, subrayado de nav) pero **falla** el 4.5:1 que exige el texto. `--accent-ink` (`#0d7a33`) da 5.46:1 y cumple AA. Usá `--accent` solo para elementos no textuales y `--accent-ink` para todo texto verde. No inviertas esto.

**Por qué `--st-cancel` no se aliasa a `--muted`:** `#6b7280` sobre `#f0f1f0` da 4.27:1 y no cumple AA. `#5b6270` da 5.41:1. Son dos grises parecidos a propósito: el contraste lo exige.

- [ ] **Step 1b: Corregir el contraste de `::selection`**

La regla `::selection` pone texto blanco sobre `var(--accent)`. Con el ámbar viejo eso daba 4.67:1 y pasaba AA; con el verde de marca da **3.42:1** y falla. El texto seleccionado es texto.

```css
::selection {
  background: var(--accent-ink);
  color: #fff;
}
```

Blanco sobre `--accent-ink` da 5.46:1.

Agregá también este comentario sobre el par de verdes, para que nadie los "simplifique" a uno solo más adelante:

```css
  /* Brand accent — Servicios AGE green.
     --accent is 3.41:1 on white: OK for non-text UI (focus ring, nav underline),
     NOT for text. Use --accent-ink (5.46:1) for anything that renders as text. */
```

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

Línea 4, dentro del comentario de bloque. **En inglés**: este archivo usa comentarios en inglés y strings de usuario en español. No traduzcas los comentarios que no tocás.

```css
   Servicios AGE — design system
   Black and white with a green brand accent.
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

## Task 2: Assets del logo — ✅ HECHA (commit `9fbd411`)

**Esta task se ejecutó de forma distinta a como estaba planeada. Lo que sigue es el registro de lo que realmente se hizo, no instrucciones pendientes.**

### Por qué cambió el enfoque

El plan original hacía dibujar tres SVG a mano, aproximando el glifo del logo. Esa versión se implementó (commit `8ecc937`) y **estaba mal**: leí la E como barras separadas con una flecha dibujada encima, cuando en realidad es un **bloque sólido con la flecha calada en negativo**. Como la flecha era blanca sobre página blanca, en los huecos entre barras desaparecía y se veía cortada.

Después el usuario aportó el arte original. El archivo que envió (`Servicios_AGE.svg`, 108 KB) resultó **no ser vectorial**: era un PNG de 3000×3000 incrustado en base64 dentro de andamiaje SVG — 99% de los bytes eran datos de imagen y el único `<path>` era el rectángulo del `clipPath`.

Trazarlo a mano se descartó por ser justamente lo que ya había fallado. En su lugar se generaron PNG a medida desde el arte de 3000px, porque **la app usa el logo en exactamente tres tamaños conocidos** y la escalabilidad infinita del vector no tiene ningún consumidor real acá.

### Assets resultantes

| Archivo | Dimensiones | Peso | Contenido |
|---|---|---|---|
| `public/logo.png` | 494×240 | 18 KB | Lockup completo, 3× del alto de 80px del login |
| `public/logo-mark.png` | 78×96 | 2,4 KB | Glifo de la E, para la marca de 27px de la nav |
| `src/app/icon.ico` | 16/32/48 | 3,4 KB | Favicon multitamaño, cada uno renderizado a propósito |
| `src/app/apple-icon.png` | 180×180 | 7,9 KB | Palabra AGE completa sobre placa negra |

Total ~32 KB, contra 108 KB del SVG en cada carga.

### Decisiones de diseño registradas

- **El favicon usa el glifo de la E, no la palabra AGE.** El usuario pidió AGE en los iconos, y se cumple en `apple-icon.png` (180px), donde se ve perfecto. Pero AGE tiene proporción 2,83:1 y a 16px —el tamaño real de la pestaña— colapsa en una mancha ilegible; se verificó renderizándolo y ampliándolo. El glifo de la E es 0,82:1, llena el cuadrado y se distingue. Los navegadores eligen el archivo según el contexto, así que se obtienen ambos.
- **La marca de la nav también usa el glifo de la E**, no la palabra: va a 27px (tamaño chico) y además se muestra junto al texto "Servicios AGE", así que la palabra en la imagen sería redundante.
- **El verde del arte original mide exactamente `#16a045`**, idéntico a `--accent` en `globals.css`. No hubo que reconciliar nada.

### Verificación hecha

`npx playwright test tests/e2e/branding.spec.ts` → 2 passed.

El test cubre dos cosas: que `/logo.png` y `/logo-mark.png` respondan 200 con content-type de imagen, y que el `<head>` declare un `<link rel="icon">` que efectivamente responda. Lo segundo confirma que la convención de iconos del App Router funciona en esta versión de Next — se verificó en lugar de asumirse, como advierte `AGENTS.md`.

### Copia de respaldo

El archivo de Canva del usuario quedó respaldado fuera del repo, en el scratchpad de la sesión (`backup_logo_canva.svg`), y el original sigue en su carpeta de descargas. El arte fuente a 3000px se puede reconstruir desde él si hiciera falta regenerar los assets a otros tamaños.

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
  height: 1.7rem;
  width: auto;
  display: block;
  flex-shrink: 0;
}
```

**No lo hagas cuadrado.** `logo-mark.png` es 78×96 (proporción 0,81); fijar ancho y alto iguales achataría el glifo. Se restringe el alto y el ancho se deduce.

Se van `border-radius`, `background`, `color`, `display: grid`, `place-items`, `font-size`, `font-weight` y el `box-shadow` interior: todos existían para dibujar la caja `AG`, que ya no está.

- [ ] **Step 4: Usar el logo en la nav del dashboard**

En `src/app/dashboard/layout.tsx`, reemplazá el bloque de la marca (líneas 25–28):

```tsx
<span className="brand shrink-0">
  <img src="/logo-mark.png" alt="" aria-hidden="true" className="brand-mark" />
  Servicios AGE
</span>
```

El `alt` va vacío y con `aria-hidden`: el nombre ya está en el texto que sigue, así que un `alt="Servicios AGE"` haría que un lector de pantalla lo anuncie dos veces. La imagen es decorativa acá.

- [ ] **Step 5: Usar el logo en la nav del portal**

En `src/app/portal/layout.tsx`, reemplazá el bloque de la marca (líneas 11–14):

```tsx
<span className="brand shrink-0">
  <img src="/logo-mark.png" alt="" aria-hidden="true" className="brand-mark" />
  Portal
</span>
```

- [ ] **Step 6: Usar el lockup completo en el login**

En `src/app/login/page.tsx`, reemplazá el encabezado (líneas 13–21):

```tsx
<div className="mb-6 flex flex-col items-center gap-3 text-center">
  <img src="/logo.png" alt="Servicios AGE" width={247} height={120} className="h-20 w-auto" />
  <p className="eyebrow">Acceso interno</p>
</div>
```

Acá el `alt` **sí** lleva el nombre: el `<h1>` de texto desaparece y esta imagen queda como única portadora de la marca. `width`/`height` son la mitad de los píxeles reales del archivo (494×240, que es 3× para pantallas retina); declararlos evita que el layout salte mientras carga.

El `<h1>` con el nombre se va: el lockup ya contiene el nombre de la empresa, y repetirlo hace que un lector de pantalla lo anuncie dos veces.

- [ ] **Step 7: Excluir los SVG del middleware**

En `src/proxy.ts`, línea 48:

```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.ico|apple-icon.png|logo.png|logo-mark.png).*)'],
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

El logo son cuatro PNG generados desde el arte original a 3000px:

- `public/logo.png` (494×240) — lockup completo, login. Es 3× del alto de 80px
  al que se muestra, para pantallas retina.
- `public/logo-mark.png` (78×96) — glifo de la E, marca de 27px en las navs.
- `src/app/icon.ico` (16/32/48) — favicon de la pestaña, con el glifo de la E.
- `src/app/apple-icon.png` (180×180) — icono de app, con la palabra AGE completa.

**Son PNG a propósito, no SVG.** El arte de origen no es vectorial, y la app usa
el logo en tres tamaños fijos y conocidos, así que renderizar a medida da archivos
más chicos y más nítidos que escalar en tiempo de ejecución. No los reemplaces por
un SVG "porque escala" sin medir: el SVG que existía pesaba 108 KB y era un PNG
envuelto.

**La pestaña usa el glifo de la E y no la palabra AGE por una razón medida:** AGE
es 2,83:1, y a 16px se vuelve ilegible. El glifo es 0,82:1 y llena el cuadrado.
La palabra completa sí se usa en `apple-icon.png`, donde el tamaño la sostiene.

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
