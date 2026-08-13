# Refinamiento del sistema visual — Servicios AGE

Fecha: 2026-08-12
Estado: propuesto
Alcance: refinamiento (opción A), no rediseño

## Problema

La interfaz se lee como "generada". No por los tells habituales de código —
el detector de Impeccable encuentra 0 hallazgos sobre `src/`, verificado
contra un archivo de control que sí dispara— sino porque las decisiones de
diseño no están jerarquizadas: los mismos recursos expresivos están
aplicados a todo, y varios sistemas redundantes resuelven el mismo problema
al mismo tiempo.

Diagnóstico concreto:

1. **El home del dashboard no muestra estado.** `src/app/dashboard/page.tsx`
   es una grilla de seis cards que son links con una flecha `→`, y los seis
   destinos ya están en el nav. Cero datos. Es el patrón de dashboard
   generado por excelencia.
2. **Mono + mayúsculas + tracking está en todo.** `.btn`, `.eyebrow`,
   `thead th`, `.status` y `.brand` usan IBM Plex Mono en mayúsculas con
   letter-spacing. Cuando el recurso está en todos lados deja de señalar.
3. **La tabla apila tres sistemas de separación.** Borde exterior + radio +
   sombra + zebra + hover + fondo de `thead`. Además la zebra
   (`color-mix(--surface-2 55%)`) y el hover (`--surface-2`) son casi el
   mismo valor: al pasar sobre una fila par no pasa nada visible.
4. **11 columnas sin jerarquía en mantenimientos.** Subtotal / Impuesto /
   Total son tres columnas de dinero donde solo Total sostiene una decisión.
   Y los importes se imprimen crudos, con `''` para null mientras la fecha
   usa `—`.
5. **Los chips de estado codifican un valor tres veces**: punto de color,
   píldora tintada y mayúsculas mono, en cinco tonos.
6. **`--radius: 10px` y `--radius-sm: 7px`** no son una escala; son dos
   números cercanos que se leen como inconsistencia.

## Principio rector

Un recurso expresivo señala algo solo si no está en todas partes. El
refinamiento consiste en devolverle a cada recurso un único trabajo:

- **Mono** = dato de máquina y valor literal. Nada más.
- **Color de estado** = un solo encoding por chip.
- **Regla hairline** = separación de filas. Sin zebra, sin sombra.
- **Verde** = el acento sigue reservado a no-texto (`--accent`) y texto
  (`--accent-ink`), tal como fija AGENTS.md §8.

## Diseño

### 1. Tipografía

Regla dura: `var(--font-plex-mono)` solo en `.mono`, `td.num`/`th.num`,
`.brand` (es logotipo, es identidad) y `.eyebrow` (queda como el único uso
expresivo del recurso, una vez por pantalla).

Pierden el mono, las mayúsculas y el tracking:

| Selector | Antes | Después |
|---|---|---|
| `.btn` | mono, 0.74rem, uppercase, ls 0.04em | sans, 0.875rem, weight 500 |
| `thead th` | mono, 0.68rem, uppercase, ls 0.09em | sans, 0.8125rem, weight 600 |
| `.status` | mono, 0.66rem, uppercase, ls 0.04em | sans, 0.8125rem, weight 500 |

Escala tipográfica explícita, en reemplazo de los ocho tamaños arbitrarios
actuales (0.66 / 0.68 / 0.74 / 0.82 / 0.85 / 0.9 / 0.95 / 1rem):

```
--text-xs:  0.75rem
--text-sm:  0.8125rem
--text-md:  0.875rem
--text-base: 1rem
--text-lg:  1.25rem
--text-xl:  1.5rem
--text-2xl: 2rem
```

Se conserva intacta la regla de 16px en inputs bajo `sm` — es funcional
(zoom automático de Safari iOS), no estética, y el comentario que lo explica
se queda.

### 2. Radio y superficie

```
--radius-sm: 4px    inputs, botones
--radius:    8px    cards
--radius-pill: 999px  chips
```

La tabla pierde el radio: un radio exterior la convierte en tarjeta, y una
tabla operativa densa no es una tarjeta.

### 3. Tabla — un solo sistema

Se van: `box-shadow`, `border-radius`, borde exterior, zebra
(`tbody tr:nth-child(even)`) y el fondo de `thead tr`.

Quedan: regla `--line` bajo cada fila, regla `--line-strong` bajo el
`thead`, y hover `--surface-2` — que ahora sí se ve, porque no compite con
la zebra.

El padding de celda pasa de `p-2` (0.5rem) a 0.625rem vertical / 0.75rem
horizontal, definido en `globals.css` sobre `td`/`th`. Eso permite borrar el
`className="p-2"` repetido doce veces por página en cada listado, que es
donde el markup se siente generado.

`td.num` se mantiene como está: `text-align: right` + `tabular-nums`.

### 4. Chips de estado

Se elimina el pseudo-elemento `::before` (el punto) y la píldora tintada
para los estados neutros: queda el texto en el color del estado, weight 500.
La etiqueta ya es el portador de significado; el color solo la refuerza, así
que no se pierde accesibilidad.

**`solicitado` conserva la píldora tintada.** Es el único estado que exige
una acción del negocio, y dejarlo como el único elemento con fondo en toda
la tabla es lo que produce jerarquía real: una cosa resalta.

Consecuencia de contraste a verificar: los `--st-*` pasan de ser texto sobre
fondo tintado a texto sobre blanco. Hay que medir cada uno contra `#ffffff`
y exigir ≥ 4.5:1; los que no pasen se oscurecen, y la tabla resultante se
agrega a `docs/marca.md` junto a las que ya están.

### 5. Jerarquía de columnas en mantenimientos

- Se quitan **Subtotal** e **Impuesto** de la tabla. El desglose vive en la
  pantalla de edición, que ya lo muestra completo. Queda **Total**.
- **Total** se formatea con `Intl.NumberFormat('es-CR')`.
- Todas las celdas vacías usan `—`, no `''`.

### 6. Home del dashboard

Se reemplaza la grilla de seis links por estado real: el conteo de
mantenimientos en `solicitado` como entrada accionable, y los últimos
registros. La navegación ya la resuelve el nav; el home deja de duplicarla.

Esta sección es **separable**: es un cambio de arquitectura de información,
no del sistema visual, y puede dejarse fuera sin afectar a las demás.

### 7. Movimiento

Un solo par de tokens (`--dur: 120ms`, `--ease: ease`) reemplazando las seis
duraciones sueltas actuales. Se quita el `translateY(1px)` de `.btn:active`
y el desplazamiento de la flecha en hover (que desaparece con el home).

## Fuera de alcance

- Cambiar la paleta base o las tipografías. Blanco/negro + verde e IBM Plex
  se conservan: son la parte del sistema que ya es propia.
- Introducir una librería de componentes (prohibido por AGENTS.md §8).
- Alterar `--accent` / `--accent-ink` o su regla de uso.
- Tocar los assets de marca (AGENTS.md §8: PNG a propósito, favicon con la
  glifa E).
- Formatear el `Total:` del formulario en
  `src/app/dashboard/maintenances/cost-fields.tsx` — ver restricciones.
- Cualquier cambio de esquema, RLS, políticas o migraciones. Este trabajo no
  toca la base de datos.

## Restricciones de tests (verificadas contra `tests/e2e/`)

Tres aserciones son frágiles frente a este trabajo:

1. **`tests/e2e/maintenances.spec.ts:26`** —
   `expect(page.getByText('Total:')).toContainText('113000')`. Ese `Total:`
   es el del **formulario** (`cost-fields.tsx:81`), no el de la tabla. Por
   eso el formateo de moneda se aplica **solo en la tabla**: formatear el
   del formulario rompería el test.
2. **`tests/e2e/branding.spec.ts:38`** —
   `expect(page.getByText('catálogo de Servicios AGE')).toBeVisible()`. Esa
   frase está en el párrafo del home. Si el home se reescribe (sección 6),
   la aserción se actualiza al copy nuevo. No se conserva la frase de
   adorno para satisfacer el test: el test describe el copy, no al revés.
3. **`tests/e2e/maintenance-requests.spec.ts:21`** —
   `getByRole('cell', { name: 'solicitado' })`. Sobrevive: el chip sigue
   renderizando el texto `Solicitado` y `getByRole` normaliza mayúsculas.

Sobreviven sin cambios todos los `getByLabel` de formularios, los
`getByRole('button' | 'link')` y los `getByRole('row')`, porque este trabajo
no cambia etiquetas, textos de acción ni estructura de filas — salvo las dos
columnas de dinero que se retiran, que ninguna aserción consulta.

## Verificación

1. `npm run test:unit` — no debería moverse; `permissions.ts` y
   `maintenances.ts` no se tocan.
2. `npm run test:e2e` — con `npx supabase db reset`,
   `npx tsx scripts/seed-admin.ts` y `npx tsx scripts/seed-portal-test.ts`
   antes, en ese orden, y `workers: 1` sin subir.
3. `node .claude/skills/impeccable/scripts/detect.mjs src/` — debe seguir en
   0 hallazgos.
4. Medición de contraste de los cinco `--st-*` sobre blanco, con la tabla
   resultante agregada a `docs/marca.md`.
5. Revisión visual en el navegador a 1280px y 375px, comprobando que
   sobreviven las reglas móviles: `white-space: nowrap` en tablas bajo 40rem
   y los 44px de área táctil bajo 48rem.

## Orden de ejecución

Las secciones 1–5 y 7 son un bloque coherente sobre `globals.css` más los
listados. La sección 6 es independiente y va al final, para poder descartarla
sin rehacer nada.
