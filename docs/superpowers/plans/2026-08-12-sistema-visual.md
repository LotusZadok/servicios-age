# Refinamiento del sistema visual — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Devolverle jerarquía al sistema visual — que cada recurso expresivo señale una sola cosa — sin cambiar la paleta, las tipografías ni la identidad.

**Architecture:** Casi todo el trabajo es en `src/app/globals.css`, que ya funciona como hoja de sistema (estiliza `table`, `input`, `.btn`, `.status` por elemento y clase, no por página). El markup de las 8 páginas con tabla se limpia de clases presentacionales de Tailwind que hoy contradicen esa hoja. Se agrega un único módulo nuevo, `src/lib/format.ts`, con las dos funciones puras de presentación de datos que hoy están implícitas y son inconsistentes.

**Tech Stack:** Next 16, React 19, Tailwind v4 (`@theme inline`), Vitest (unit), Playwright (E2E, `workers: 1`).

**Spec:** [docs/superpowers/specs/2026-08-12-sistema-visual-design.md](../specs/2026-08-12-sistema-visual-design.md)

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `src/app/globals.css` | Hoja de sistema: tokens, base, tabla, controles, componentes | Modificar (tareas 1, 2, 3, 5, 8) |
| `src/lib/format.ts` | Funciones puras de presentación: moneda y placeholder de nulos | **Crear** (tarea 6) |
| `tests/unit/format.test.ts` | Tests de `src/lib/format.ts` | **Crear** (tarea 6) |
| `src/app/dashboard/{brands,clients,locations,machine-types,machines,maintenances,users}/page.tsx` | Listados | Modificar (tareas 4, 7) |
| `src/app/portal/machines/[id]/page.tsx` | Detalle de máquina del portal | Modificar (tarea 4) |
| `src/components/status-badge.tsx` | Chip de estado | Sin cambios — el rediseño del chip es 100 % CSS |
| `src/app/dashboard/page.tsx` | Home del dashboard | Modificar (tarea 10, separable) |
| `tests/e2e/branding.spec.ts` | Aserción de copy del home | Modificar (tarea 10, separable) |
| `docs/marca.md` | Inventario de marca y tablas de contraste | Modificar (tarea 9) |

**No se tocan:** `src/lib/permissions.ts`, `src/lib/maintenances.ts`, `src/components/table-scroll.tsx`, `src/app/dashboard/maintenances/cost-fields.tsx`, `src/proxy.ts`, nada bajo `supabase/`.

---

### Task 1: Tokens de escala — tipografía, radio y movimiento

Hoy conviven ocho tamaños de fuente arbitrarios (0.66 / 0.68 / 0.74 / 0.82 / 0.85 / 0.9 / 0.95 / 1rem), dos radios cercanos (10px y 7px) y seis duraciones de transición sueltas. Esta tarea agrega la escala; las tareas siguientes la consumen.

**Files:**
- Modify: `src/app/globals.css:40-49`

- [ ] **Step 1: Reemplazar el bloque de tokens de forma**

Buscar en `:root` estas cuatro líneas:

```css
  --ring: 0 0 0 3px rgba(22, 160, 69, 0.28);
  --radius: 10px;
  --radius-sm: 7px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.22);
```

y dejarlas así:

```css
  --ring: 0 0 0 3px rgba(22, 160, 69, 0.28);

  /* Escala de radio. 4/8 es una progresión, no dos números cercanos:
     a 10px y 7px la diferencia no se lee como sistema sino como descuido. */
  --radius-sm: 4px;
  --radius: 8px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.22);

  /* Escala tipográfica. Reemplaza los ocho tamaños sueltos que había. */
  --text-xs: 0.75rem;
  --text-sm: 0.8125rem;
  --text-md: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;

  /* Movimiento: una duración y una curva para toda la app. */
  --dur: 120ms;
  --ease: ease;
```

- [ ] **Step 2: Verificar que compila y que la app sigue en pie**

Run: `npm run build`
Expected: build exitoso, sin errores de CSS.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(ui): escala explicita de tipografia, radio y movimiento"
```

---

### Task 2: El mono vuelve a significar dato de máquina

`.btn`, `thead th` y `.status` usan IBM Plex Mono en mayúsculas con tracking, igual que `.mono`. Cuando el recurso está en todos lados deja de señalar. Quedan en mono solo `.mono`, `.num`, `.brand` (logotipo) y `.eyebrow` (único uso expresivo, una vez por pantalla).

**Files:**
- Modify: `src/app/globals.css:145-155` (`thead th`), `:192-208` (`.btn`), `:320-333` (`.status`)

- [ ] **Step 1: Reescribir `thead th`**

Reemplazar:

```css
thead th {
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 0.68rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--muted);
  border-bottom: 1px solid var(--line-strong) !important;
  padding-top: 0.7rem;
  padding-bottom: 0.7rem;
}
```

por:

```css
thead th {
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: left;
  color: var(--muted);
  border-bottom: 1px solid var(--line-strong);
  white-space: nowrap;
}
```

El `text-align: left` pasa acá porque en la tarea 4 se borra el `text-left`
que hoy vive en el markup de cada `<tr>` del `<thead>`. El `!important` se
va con él: existía para ganarle al `border-b` de Tailwind, que también
desaparece en la tarea 4. El padding lo unifica la tarea 3.

- [ ] **Step 2: Reescribir `.btn`**

Reemplazar las seis primeras declaraciones tipográficas de `.btn`:

```css
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 0.74rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.6rem 1rem;
```

por:

```css
  font-size: var(--text-md);
  font-weight: 500;
  padding: 0.55rem 0.9rem;
```

(El padding baja levemente porque sin mayúsculas el texto ocupa menos alto
óptico y el botón quedaba inflado.)

- [ ] **Step 3: Reescribir la cabecera de `.status`**

En el bloque `.status`, reemplazar:

```css
  font-family: var(--font-plex-mono), ui-monospace, monospace;
  font-size: 0.66rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.16rem 0.5rem;
  border-radius: 999px;
```

por:

```css
  font-size: var(--text-sm);
  font-weight: 500;
```

(El fondo, el padding y el radio se resuelven en la tarea 5.)

- [ ] **Step 4: Normalizar los tamaños sueltos restantes**

En el mismo archivo, reemplazar cada valor literal por su token:

| Selector | Antes | Después |
|---|---|---|
| `.eyebrow` | `font-size: 0.68rem` | `font-size: var(--text-xs)` |
| `.nav-link` | `font-size: 0.85rem` | `font-size: var(--text-md)` |
| `.link-edit` | `font-size: 0.85rem` | `font-size: var(--text-md)` |
| `.link-danger` | `font-size: 0.85rem` | `font-size: var(--text-md)` |
| `.mono` | `font-size: 0.82rem` | `font-size: var(--text-sm)` |
| `.empty .empty-title` | `font-size: 0.95rem` | `font-size: var(--text-base)` |
| `.empty .empty-hint` | `font-size: 0.85rem` | `font-size: var(--text-md)` |

No tocar los `font-size` de `input, select, textarea` (`1rem` y el `0.9rem`
del media query de 40rem): son funcionales, no estéticos — evitan el zoom
automático de Safari iOS — y el comentario que lo explica se queda tal cual.

- [ ] **Step 5: Verificar**

Run: `npm run build`
Expected: build exitoso.

Run: `grep -n "plex-mono" src/app/globals.css`
Expected: exactamente 4 apariciones — en `@theme inline` (`--font-mono`), `.brand`, `.eyebrow` y `.mono`.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(ui): reservar el mono para dato de maquina"
```

---

### Task 3: La tabla, con un solo sistema de separación

Hoy hay tres sistemas apilados: borde exterior + radio + sombra, zebra, y hover. Además la zebra (`--surface-2` al 55 %) y el hover (`--surface-2`) son casi el mismo valor, así que al pasar sobre una fila par no pasa nada visible.

**Files:**
- Modify: `src/app/globals.css:130-173` y `:363-366`

- [ ] **Step 1: Reescribir el bloque de tabla**

Reemplazar todo el bloque desde `table {` hasta `tbody tr:hover { ... }` (líneas ~130-173) por:

```css
/* ---------- Tables (auto-upgrades every list page) ----------
   Un solo sistema de separación: regla hairline por fila. Sin zebra, sin
   sombra, sin radio. Una tabla operativa densa no es una tarjeta, y zebra +
   hover + fondo de thead resuelven todos el mismo problema compitiendo
   entre sí. */
table {
  width: 100%;
  background: var(--surface);
  border-collapse: collapse;
}

thead th {
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: left;
  color: var(--muted);
  border-bottom: 1px solid var(--line-strong);
  white-space: nowrap;
}

tbody td {
  border-bottom: 1px solid var(--line);
  color: var(--ink-soft);
  vertical-align: middle;
}

th,
td {
  padding: 0.625rem 0.75rem;
}

th:first-child,
td:first-child {
  padding-left: 0;
}

th:last-child,
td:last-child {
  padding-right: 0;
}

tbody tr {
  transition: background-color var(--dur) var(--ease);
}

tbody tr:hover {
  background: var(--surface-2);
}
```

Nota: `thead th` queda definido acá y **no** debe quedar duplicado del paso
de la tarea 2 — si la tarea 2 ya lo dejó con este contenido exacto, esta
tarea solo confirma que hay una única definición.

- [ ] **Step 2: Borrar el bloque de zebra**

Eliminar por completo estas tres líneas (~363-366), que quedan obsoletas:

```css
tbody tr:nth-child(even) { background: color-mix(in srgb, var(--surface-2) 55%, transparent); }
tbody tr:hover { background: var(--surface-2); }
```

Conservar la línea siguiente, que sigue siendo válida y necesaria:

```css
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: Verificar que no quedó zebra ni sombra en tablas**

Run: `grep -n "nth-child(even)\|shadow-sm" src/app/globals.css`
Expected: ninguna aparición de `nth-child(even)`; `--shadow-sm` sigue apareciendo solo en `:root` y en `.card` / `.btn-primary`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(ui): una sola separacion de filas en tablas"
```

---

### Task 4: Sacar del markup las clases que pelean con la hoja

Las 8 páginas con tabla traen `min-w-full border-collapse bg-white` en `<table>` y `border-b text-left text-sm` en cada `<tr>`. Esas clases ganan por especificidad y anulan justo lo que define `globals.css`. Con la tarea 3 en su lugar, sobran todas — y con ellas se va el `p-2` repetido en cada celda.

**Files (los 8):**
- Modify: `src/app/dashboard/brands/page.tsx`
- Modify: `src/app/dashboard/clients/page.tsx`
- Modify: `src/app/dashboard/locations/page.tsx`
- Modify: `src/app/dashboard/machine-types/page.tsx`
- Modify: `src/app/dashboard/machines/page.tsx`
- Modify: `src/app/dashboard/maintenances/page.tsx`
- Modify: `src/app/dashboard/users/page.tsx`
- Modify: `src/app/portal/machines/[id]/page.tsx`

- [ ] **Step 1: Aplicar en cada archivo estas cinco sustituciones exactas**

| Buscar | Reemplazar |
|---|---|
| `<table className="min-w-full border-collapse bg-white">` | `<table>` |
| `<tr className="border-b text-left text-sm">` | `<tr>` |
| `className="border-b text-sm"` (en `<tr key=…>`) | *(borrar el atributo entero)* |
| `<th className="p-2 num">` | `<th className="num">` |
| `<td className="p-2 num">` | `<td className="num">` |
| `<th className="p-2">` | `<th>` |
| `<td className="p-2">` | `<td>` |
| `<th className="p-2" />` | `<th />` |

**No tocar** ningún otro `p-2`: `src/app/dashboard/maintenances/fields.tsx:1` tiene uno que no está en una tabla, y los `className="flex items-center gap-3"` de los `<div>` internos de la celda de acciones se quedan como están — junto con el comentario que explica por qué el flex no va sobre el `<td>`.

**Worked example** — `src/app/dashboard/brands/page.tsx`, de la línea 35 a la 67, queda exactamente así:

```tsx
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(brands ?? []).map((brand) => (
            <tr key={brand.id}>
              <td>{brand.name}</td>
              <td>{brand.description}</td>
              {/* El flex va en un div interno: sobre el propio <td>, display:flex
                  le quita el rol de celda. */}
              <td>
                <div className="flex items-center gap-3">
                  <Link href={`/dashboard/brands/${brand.id}/edit`} className="link-edit">
                    Editar
                  </Link>
                  {canDelete(profile.role) && (
                    <form action={deleteBrand.bind(null, brand.id)}>
                      <button type="submit" className="link-danger">
                        Archivar
                      </button>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
```

- [ ] **Step 2: Verificar que no quedó ninguna clase de tabla en el markup**

Run: `grep -rn "min-w-full\|border-collapse\|border-b text" src/app --include=*.tsx`
Expected: sin resultados.

Run: `grep -rn "p-2" src/app --include=*.tsx`
Expected: exactamente 1 resultado, en `src/app/dashboard/maintenances/fields.tsx`.

- [ ] **Step 3: Verificar que los roles ARIA de tabla sobreviven**

Run: `npx playwright test tests/e2e/clients-crud.spec.ts tests/e2e/locations-crud.spec.ts`
Expected: PASS. Estos specs usan `getByRole('row')` y `getByRole('cell')`, así que fallan si el markup perdió semántica de tabla.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard src/app/portal
git commit -m "refactor(ui): que la hoja de sistema mande en las tablas"
```

---

### Task 5: Chips de estado — un encoding, no tres

Punto de color + píldora tintada + mayúsculas mono son tres codificaciones del mismo valor. Las mayúsculas ya se fueron en la tarea 2. Acá se van el punto y la píldora — salvo en `solicitado`, que es el único estado que exige acción del negocio y se queda como el único elemento con fondo de toda la tabla. Eso es la jerarquía: una cosa resalta.

**Files:**
- Modify: `src/app/globals.css:320-345`

- [ ] **Step 1: Reescribir el bloque completo de status**

Reemplazar desde `/* ---------- Status chips ---------- */` hasta la línea de `.status-cancelado` por:

```css
/* ---------- Status chips ----------
   El texto es el portador de significado; el color solo lo refuerza, así que
   quitar el punto y la píldora no pierde accesibilidad. Los cinco colores
   están medidos sobre blanco y pasan AA como texto (ver docs/marca.md).
   `solicitado` conserva el fondo a propósito: es el único estado que pide
   una acción, y ser el único con fondo es lo que lo hace destacar. */
.status {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
}

.status-solicitado {
  color: var(--st-req);
  background: var(--st-req-weak);
  border-radius: var(--radius-pill);
  padding: 0.15rem 0.55rem;
}

.status-programado { color: var(--st-prog); }
.status-en_proceso { color: var(--st-proc); }
.status-completado { color: var(--st-done); }
.status-cancelado  { color: var(--st-cancel); }
```

Los tokens `--st-prog-weak`, `--st-proc-weak`, `--st-done-weak` y
`--st-cancel-weak` quedan sin uso. **Borrarlos de `:root`** (líneas ~31-38),
conservando `--st-req-weak`, que sigue usándose.

Cuidado: `--st-done-weak` es `var(--accent-weak)`, pero `--accent-weak` se
define aparte y **no** se borra.

- [ ] **Step 2: Verificar que no quedaron referencias colgando**

Run: `grep -n "st-prog-weak\|st-proc-weak\|st-done-weak\|st-cancel-weak" src/app/globals.css`
Expected: sin resultados.

- [ ] **Step 3: Verificar que el chip sigue siendo legible por rol**

Run: `npx playwright test tests/e2e/maintenance-requests.spec.ts`
Expected: PASS. Ese spec usa `getByRole('cell', { name: 'solicitado' })`; el chip sigue renderizando el texto `Solicitado` y `getByRole` normaliza mayúsculas.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(ui): un solo encoding por chip de estado"
```

---

### Task 6: Módulo de formato — moneda y nulos

Hoy la tabla de mantenimientos imprime `{m.cost_subtotal ?? ''}` (cadena vacía para null) mientras la fecha usa `'—'`. Y los importes salen crudos, sin separador de miles. Las dos reglas se vuelven funciones puras con tests.

**Files:**
- Create: `src/lib/format.ts`
- Test: `tests/unit/format.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatColones, orDash } from '@/lib/format'

describe('orDash', () => {
  it('devuelve una raya para null y undefined', () => {
    expect(orDash(null)).toBe('—')
    expect(orDash(undefined)).toBe('—')
  })

  it('devuelve una raya para la cadena vacía', () => {
    expect(orDash('')).toBe('—')
  })

  it('conserva el cero, que es un valor y no una ausencia', () => {
    expect(orDash(0)).toBe('0')
  })

  it('devuelve el valor tal cual cuando hay contenido', () => {
    expect(orDash('BOL-999')).toBe('BOL-999')
  })
})

describe('formatColones', () => {
  // OJO: el separador de miles de es-CR es U+00A0 (espacio duro), no un
  // espacio normal. Verificado en esta máquina con Node 22.14 / ICU 76.
  //
  // En las dos aserciones de abajo ese carácter está escrito literal, y es
  // invisible: si un reformateo o un copiado lo convierte en espacio normal,
  // el test falla sin que se vea nada raro en el diff. Al escribir el
  // archivo, construir el separador con `String.fromCharCode(0xa0)` en una
  // constante y usarla con template literals:
  //
  //   const NBSP = String.fromCharCode(0xa0)
  //   expect(formatColones(113000)).toBe(`₡113${NBSP}000`)
  //
  it('agrupa los miles con espacio duro', () => {
    expect(formatColones(113000)).toBe('₡113 000')
  })

  it('no muestra decimales', () => {
    expect(formatColones(1000)).toBe('₡1 000')
  })

  it('devuelve una raya para null, no cero', () => {
    expect(formatColones(null)).toBe('—')
  })

  it('formatea el cero como monto', () => {
    expect(formatColones(0)).toBe('₡0')
  })
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run tests/unit/format.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/format"`.

- [ ] **Step 3: Escribir la implementación mínima**

Crear `src/lib/format.ts`:

```ts
/**
 * Presentación de datos en listados. Puro: sin Supabase, sin async.
 *
 * La ausencia se muestra siempre igual, con una raya. Antes convivían `''`
 * para los importes y `'—'` para las fechas, y una celda vacía no se
 * distinguía de una celda que el servidor no llenó.
 */

const COLONES = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Placeholder único para toda ausencia de valor. El cero no es ausencia. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

/** Importe en colones, sin decimales. Null se muestra como ausencia, no como cero. */
export function formatColones(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return COLONES.format(value)
}
```

- [ ] **Step 4: Correr el test y ajustar el separador esperado**

Run: `npx vitest run tests/unit/format.test.ts`

`Intl` con locale `es-CR` usa un separador de miles que puede ser espacio fino (U+202F), espacio duro o punto según la versión de ICU del Node instalado. **Si el test falla solo por el separador**, copiar el valor real que reporta Vitest al `expect` — no cambiar la implementación para forzar un separador a mano.

Expected tras el ajuste: 8 tests PASS.

- [ ] **Step 5: Correr la suite unitaria completa**

Run: `npm run test:unit`
Expected: PASS, incluyendo los tests preexistentes de `permissions.ts` y `maintenances.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.ts tests/unit/format.test.ts
git commit -m "feat(ui): modulo de formato para moneda y ausencia de valor"
```

---

### Task 7: Jerarquía de columnas en mantenimientos

Subtotal / Impuesto / Total son tres columnas de dinero donde solo Total sostiene una decisión. El desglose ya vive completo en la pantalla de edición.

**Files:**
- Modify: `src/app/dashboard/maintenances/page.tsx`

- [ ] **Step 1: Importar el módulo de formato**

Agregar tras la línea 5 (`import { sortRequestsFirst } from '@/lib/maintenances'`):

```tsx
import { formatColones, orDash } from '@/lib/format'
```

- [ ] **Step 2: Quitar las dos cabeceras de desglose**

Borrar estas dos líneas del `<thead>`:

```tsx
            <th className="num">Subtotal</th>
            <th className="num">Impuesto</th>
```

(Tras la tarea 4 ya no llevan `p-2`.)

- [ ] **Step 3: Reescribir las celdas del `<tbody>`**

Reemplazar el bloque de celdas de datos por:

```tsx
              <td><span className="mono">{orDash(m.date)}</span></td>
              <td>{orDash(m.machines?.name)}</td>
              <td>{orDash(m.locations?.name)}</td>
              <td>{m.description}</td>
              <td>{m.is_corrective ? 'Correctivo' : 'Preventivo'}</td>
              <td><StatusBadge status={m.status} /></td>
              <td>{orDash(m.technician?.full_name)}</td>
              <td className="num"><span className="mono">{orDash(m.hour_meter)}</span></td>
              <td className="num"><span className="mono">{formatColones(m.cost_total)}</span></td>
```

Quedan 9 columnas de datos más la de acciones, contra 11 + acciones.

- [ ] **Step 4: Verificar que el conteo de columnas cierra**

Run: `grep -c "<th" src/app/dashboard/maintenances/page.tsx`
Expected: `10` (9 de datos + la vacía de acciones).

- [ ] **Step 5: Correr el spec que toca esta tabla**

Run: `npx playwright test tests/e2e/maintenances.spec.ts`
Expected: PASS.

Ese spec afirma `expect(page.getByText('Total:')).toContainText('113000')` con
el número **crudo**, pero ese `Total:` es el del **formulario**
(`src/app/dashboard/maintenances/cost-fields.tsx:81`), no el de la tabla. Por
eso este plan no formatea el del formulario. Si este test falla, el cambio se
filtró a `cost-fields.tsx`: revertirlo ahí, no editar el test.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/maintenances/page.tsx
git commit -m "refactor(ui): jerarquia de columnas y formato en mantenimientos"
```

---

### Task 8: Movimiento con un solo par de tokens

Seis duraciones sueltas, más un `translateY(1px)` en `:active` y un nudge de flecha en hover que se agregaron por elemento, no como sistema.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Reemplazar cada duración literal por los tokens**

| Selector | Antes | Después |
|---|---|---|
| `input, select, textarea` | `transition: border-color 0.15s ease, box-shadow 0.15s ease` | `transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease)` |
| `.btn` | `transition: transform 0.08s ease, background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease` | `transition: background-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), border-color var(--dur) var(--ease)` |
| `.nav-link` | `transition: color 0.15s ease` | `transition: color var(--dur) var(--ease)` |

(`tbody tr` ya quedó con los tokens en la tarea 3.)

- [ ] **Step 2: Borrar el desplazamiento del botón activo**

Eliminar por completo:

```css
.btn:active {
  transform: translateY(1px);
}
```

- [ ] **Step 3: Verificar que no quedaron duraciones sueltas**

Run: `grep -n "0\.0[0-9]s\|0\.1[0-9]s" src/app/globals.css`
Expected: sin resultados.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(ui): una duracion y una curva para toda la app"
```

---

### Task 9: Documentar el contraste de los estados en `docs/marca.md`

Los chips pasaron de texto sobre fondo tintado a texto sobre blanco. Los cinco colores fueron medidos y **los cinco pasan AA** — no hay que corregir ninguno, pero la medición tiene que quedar registrada junto a las tablas que ya están.

**Files:**
- Modify: `docs/marca.md`

- [ ] **Step 1: Agregar la tabla a la sección de contraste**

Insertar en la sección de contraste de `docs/marca.md`:

```markdown
### Colores de estado como texto sobre blanco

Desde el refinamiento de 2026-08-12 los chips de estado —salvo
`solicitado`— se renderizan como texto sobre `--surface`, sin píldora
tintada. Medidos contra `#ffffff`, umbral AA para texto normal 4.5:1:

| Token | Valor | Contraste | AA |
|---|---|---|---|
| `--st-req` | `#9a4d0f` | 6.10:1 | pasa |
| `--st-prog` | `#2b5d9c` | 6.67:1 | pasa |
| `--st-proc` | `#8a6300` | 5.43:1 | pasa |
| `--st-done` | `#0d7a33` | 5.46:1 | pasa |
| `--st-cancel` | `#5b6270` | 6.13:1 | pasa |

`--st-req` conserva además el fondo `--st-req-weak`: es el único estado que
exige una acción del negocio, y ser el único con píldora es lo que lo hace
destacar en una tabla densa.
```

- [ ] **Step 2: Commit**

```bash
git add docs/marca.md
git commit -m "docs: contraste de los colores de estado sobre blanco"
```

---

### Task 10 (separable): El home del dashboard muestra estado

`src/app/dashboard/page.tsx` es una grilla de seis cards que son links, y los seis destinos ya están en el nav. Cero datos. **Esta tarea es descartable sin rehacer nada de lo anterior** — es arquitectura de información, no sistema visual, y es la única que obliga a tocar un test.

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `tests/e2e/branding.spec.ts:38`

- [ ] **Step 1: Reescribir el home**

Reemplazar el contenido completo de `src/app/dashboard/page.tsx` por:

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { StatusBadge } from '@/components/status-badge'
import { orDash } from '@/lib/format'

export default async function DashboardHome() {
  const { profile } = await requireUser()
  const firstName = profile.full_name.split(' ')[0]
  const supabase = await createClient()

  const { count: solicitados } = await supabase
    .from('maintenances')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'solicitado')

  const { data: recientes } = await supabase
    .from('maintenances')
    .select('id, date, status, description, machines(name)')
    .order('created_at', { ascending: false })
    .limit(8)

  const pendientes = solicitados ?? 0

  return (
    <div>
      <p className="eyebrow">Panel de control</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Hola, {firstName}
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Operación de mantenimiento de Servicios AGE: máquinas, sedes y catálogo.
      </p>

      <Link
        href="/dashboard/maintenances"
        className="card mt-8 flex items-baseline gap-3 p-5"
      >
        <span className="text-3xl font-semibold tabular-nums">{pendientes}</span>
        <span className="text-[var(--muted)]">
          {pendientes === 1
            ? 'solicitud de servicio sin atender'
            : 'solicitudes de servicio sin atender'}
        </span>
      </Link>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Últimos movimientos</h2>
      {(recientes ?? []).length === 0 ? (
        <div className="empty">
          <span className="empty-title">Sin mantenimientos</span>
          <span className="empty-hint">
            Registra uno desde “Mantenimientos”, o espera a que un cliente
            solicite servicio.
          </span>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Máquina</th>
              <th>Descripción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(recientes ?? []).map((m) => (
              <tr key={m.id}>
                <td><span className="mono">{orDash(m.date)}</span></td>
                <td>{orDash(m.machines?.name)}</td>
                <td>{m.description}</td>
                <td><StatusBadge status={m.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Actualizar la aserción de branding**

En `tests/e2e/branding.spec.ts:38`, reemplazar:

```ts
  await expect(page.getByText('catálogo de Servicios AGE')).toBeVisible()
```

por:

```ts
  await expect(page.getByText('Operación de mantenimiento de Servicios AGE')).toBeVisible()
```

El test describe el copy, no al revés: la frase vieja pertenecía a un párrafo
que describía un menú que ya no existe.

- [ ] **Step 3: Verificar que la consulta respeta RLS**

La consulta nueva lee `maintenances` con el cliente de sesión
(`@/lib/supabase/server`), **no** con `admin.ts`. Un `cliente` que llegue a
`/dashboard` ya es rechazado por el guard de ruta, y aun si no lo fuera, la
política de RLS le devolvería únicamente sus propias filas. No agregar acá
ningún chequeo de rol: la autorización se hace en Postgres (AGENTS.md §1).

Run: `npx playwright test tests/e2e/portal.spec.ts tests/e2e/auth.spec.ts`
Expected: PASS.

- [ ] **Step 4: Correr branding**

Run: `npx playwright test tests/e2e/branding.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx tests/e2e/branding.spec.ts
git commit -m "feat(ui): el home del dashboard muestra estado en vez de un menu"
```

---

### Task 11: Verificación final

- [ ] **Step 1: Reset y seeds, en este orden**

```bash
npx supabase db reset
```

```bash
npx tsx scripts/seed-admin.ts
```

```bash
npx tsx scripts/seed-portal-test.ts
```

El seed del portal es obligatorio antes de E2E (AGENTS.md §2).

- [ ] **Step 2: Suite unitaria**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 3: Suite E2E completa**

Run: `npm run test:e2e`
Expected: PASS. **No subir `workers` de 1** — los specs comparten un solo dev server y una sola instancia de Supabase, y en paralelo producen timeouts indistinguibles de fallos reales (AGENTS.md §6).

- [ ] **Step 4: Detector de Impeccable**

Run: `node .claude/skills/impeccable/scripts/detect.mjs src/`
Expected: 0 hallazgos, igual que antes del trabajo.

- [ ] **Step 5: Build de producción**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Revisión visual a dos anchos**

Levantar el dev server y revisar `/dashboard/maintenances` y `/dashboard/machines` a 1280px y a 375px. Confirmar que sobreviven las dos reglas móviles que no son estéticas:

- bajo 40rem, `main table` mantiene `white-space: nowrap` y la tabla desborda dentro de `<TableScroll>` en vez de aplastar columnas;
- bajo 48rem, `.link-edit` y `.link-danger` conservan los 44px de área táctil.

---

## Notas de riesgo

- **Ninguna tarea toca la base de datos.** Sin migraciones, sin cambios de política, sin `supabase db push`.
- **`src/components/status-badge.tsx` no se modifica.** El rediseño del chip es enteramente CSS, así que el texto accesible (`Solicitado`, `Programado`, …) se conserva y los specs que buscan por rol siguen funcionando.
- **La tarea 4 es la de mayor superficie** (8 archivos) pero la de menor riesgo: solo borra clases de presentación. Si algo se rompe ahí, es visual y se ve de inmediato.
- **La tarea 10 es la única que edita un test.** Si se descarta, descartar también su cambio en `branding.spec.ts`.
