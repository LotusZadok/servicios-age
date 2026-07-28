# Rebranding: AGServicios → Servicios AGE

Documento de diseño escrito el 27 de julio de 2026, antes de implementar.
Describe el alcance decidido en ese momento —paleta, logo y nombre— y se
conserva sin editar como registro de esa decisión; el sistema actual
incluye además un cambio respecto a lo planeado aquí: los logos se
implementaron como PNG generados del arte original a 3000px en vez de los
SVG dibujados a mano que este documento especifica, con el matcher del
proxy ajustado a esos nombres de archivo (`icon.ico`, `apple-icon.png`,
`logo.png`, `logo-mark.png`).

## Contexto

La empresa cambió oficialmente de nombre y de identidad visual. Pasa a llamarse
**Servicios AGE**, con una paleta de tres colores (verde `#16a045`, negro `#000000`,
blanco `#ffffff`) y un logo nuevo (lockup "SERVICIOS" sobre "AGE", donde la E es una
marca geométrica de flecha ascendente sobre barras verdes).

La app hoy usa un sistema de diseño llamado *"Engineered"* definido en
`src/app/globals.css`: neutros cálidos tipo papel (`--bg: #f1efe9`) sobre un acento
ámbar de seguridad (`--accent: #bf5415`). El nombre `AGServicios` aparece en la
navegación, el login, el portal, el título del documento y varios textos de apoyo.
El "logo" actual no es un archivo: es una caja `AG` dibujada en CSS (`.brand-mark`).

Este cambio es transversal a toda la app pero **no toca lógica de negocio, esquema de
datos ni permisos**. Es exclusivamente capa de presentación más un carve-out explícito
de identificadores técnicos.

## Objetivo

- Toda superficie visible al usuario usa la paleta nueva y el nombre **Servicios AGE**.
- El logo existe como archivo SVG versionado, reemplazable sin tocar código.
- Los identificadores técnicos que conservan el nombre viejo quedan **documentados como
  decisión**, no como residuo.

## Decisiones tomadas (cerradas en el brainstorming)

- **Neutros:** blanco y negro puros. Se abandonan los neutros cálidos; `--bg` pasa a
  `#ffffff` y `--ink` a `#000000`.
- **Dos verdes, no uno.** `#16a045` mide **3.41:1** de contraste sobre blanco: cumple el
  mínimo 3:1 de WCAG para componentes de interfaz (subrayado de nav, anillos de foco,
  iconos) pero **falla** el 4.5:1 exigido para texto. Se introduce `--accent-ink:
  #0d7a33` (**5.46:1**, cumple AA) para todos los roles de texto. Sobre negro,
  `#16a045` da 6.15:1, así que la marca sobre fondo negro es segura.
- **Conflicto de verdes en los chips de estado:** `completado` adopta el verde de marca
  y `solicitado` deja de heredar `--accent` para tomar un ámbar propio. El verde queda
  ligado a "todo bien", que es la lectura intuitiva.
- **Retícula de fondo:** se elimina. Fue diseñada contra papel cálido; sobre blanco puro
  o desaparece o genera muaré sobre las tablas densas. El carácter "técnico" ya lo
  aportan la tipografía mono y los encabezados de tabla.
- **Logo:** se recrea como SVG (aproximación vectorial, no el archivo oficial). El
  archivo oficial se deja caer después en las mismas rutas sin tocar código.
- **Nombre:** cambia en todo lo visible al usuario y en `package.json`. **No** cambia en
  identificadores técnicos (ver siguiente sección).

## Carve-out: qué conserva el nombre viejo, y por qué

Sigue el estándar de la industria: *los nombres no son identificadores*. La capa de
marca es mutable; la capa de identificador es inmutable o se migra como proyecto
aparte.

| Identificador | Motivo de conservarlo |
|---|---|
| `supabase/config.toml` → `project_id = "AGServicios-web"` | Nombra los contenedores Docker locales. Cambiarlo hace que el CLI lo trate como proyecto nuevo: `supabase start` levanta contenedores vacíos y huérfana el volumen local con los datos sembrados. El proyecto en la nube usa un ref distinto y no se ve afectado. |
| `scripts/seed-portal-test.ts` → `portal@agservicios.local` | Editar el script no renombra cuentas existentes; crea una segunda casi idéntica. Además `E2E_CLIENT_EMAIL` en `.env.local` tendría que cambiar en sincronía. `.local` es un TLD reservado: nunca se envía correo ni se muestra al usuario. |
| `docs/superpowers/specs/`, `docs/superpowers/plans/` | Registros fechados. Un spec describe qué se decidió *en esa fecha*; editarlo retroactivamente destruye su valor como registro. Es la regla de los ADR: un registro aceptado es inmutable y se supersede, no se edita. |
| Nombre del repositorio e historial de git | Fuera del alcance de un cambio de código. Decisión aparte. |

Para que esto no se lea como descuido, se añade una sección **"Marca"** a `AGENTS.md`
—que ya se carga en cada sesión vía `CLAUDE.md`— documentando el mapeo y cerrando la
pregunta antes de que se formule.

## Fuera de alcance

- Renombrar el repositorio de git o reescribir su historial.
- Renombrar el proyecto local de Supabase o migrar las cuentas sembradas.
- Editar los specs y planes históricos.
- Tema oscuro. La app es solo claro hoy y sigue igual.
- Rediseño de layout, tipografía o componentes. Solo cambia color, nombre y logo.

## Sistema de color

Todo el color vive en `src/app/globals.css`. Ningún archivo de `src/` tiene un hex
hardcodeado, así que la migración de tokens es el grueso del trabajo visual.

```
--bg:          #f1efe9 → #ffffff
--surface:     #ffffff   (sin cambio)
--surface-2:   #f8f6f1 → #f6f7f6
--ink:         #17181a → #000000
--ink-soft:    #34363a → #383d39
--muted:       #6b6f76 → #6b7280
--line:        #e4e1d8 → #e5e7e5
--line-strong: #d3cfc3 → #d1d5d1
--accent:      #bf5415 → #16a045    marca; solo roles NO textuales
--accent-ink:  #8f3d0d → #0d7a33    verde de texto, AA sobre blanco
--accent-weak: #f6eadf → #e7f6ec
--ring:        rgba(191,84,21,.28) → rgba(22,160,69,.28)
```

**Reparto de roles de los dos verdes**

- `--accent` (`#16a045`): subrayado de nav activo, anillo de foco, flecha hover en las
  tarjetas, `::selection`, marca del logo. Nada de texto pequeño.
- `--accent-ink` (`#0d7a33`): `.eyebrow`, `.link-edit`, etiqueta del chip `completado`.

`.btn-primary` ya usa `--ink`, así que pasa a ser un botón negro real con texto blanco
(21:1) — coherente con el negro del logo. No se introducen botones verdes con texto
blanco: esa combinación da 3.41:1 y no cumple AA para texto.

**Chips de estado**

```
solicitado  ámbar  #9a4d0f sobre #fbeee2   token propio, ya no hereda --accent
programado  azul   #2b5d9c sobre #e7eef7   sin cambio
en_proceso  ámbar  #8a6300 sobre #f5eed9   sin cambio
completado  verde  #0d7a33 sobre #e7f6ec   verde de marca
cancelado   gris   #6b7280 sobre #f0f1f0   alineado al gris neutro nuevo
```

`--st-cancel` se alinea con el `--muted` nuevo (`#6b7280`) en vez de conservar
`#6b6f76`: eran dos grises indistinguibles a simple vista y mantener ambos solo
duplica tokens.

**Body:** se elimina el `background-image` de doble `linear-gradient` y su
`background-size`. Queda `background-color: var(--bg)` plano.

## Logo

Tres archivos SVG nuevos en `public/`:

| Archivo | Uso | Dónde |
|---|---|---|
| `logo.svg` | Lockup completo ("SERVICIOS" espaciado sobre "AGE") | Página de login |
| `logo-mark.svg` | Solo la marca de flecha/barras, cuadrada | Nav de dashboard y portal, ~1.6rem |
| `icon.svg` | Favicon | Reemplaza `src/app/favicon.ico` |

`.brand-mark` deja de ser una caja CSS con las letras `AG` y pasa a envolver un
`<img>` que apunta a `logo-mark.svg`. Los estilos de tamaño y radio se conservan para
no alterar el layout de la nav.

Los SVG son una **aproximación** del glifo original. Se documenta en `AGENTS.md` que
reemplazar los archivos en esas rutas actualiza toda la app sin cambios de código.

Se eliminan los SVG sobrantes del starter de Next.js (`file.svg`, `globe.svg`,
`next.svg`, `vercel.svg`, `window.svg`), que no los referencia nadie (verificado por
búsqueda).

**El `matcher` del proxy debe excluirlos.** `src/proxy.ts` corre sobre
`/((?!_next/static|_next/image|favicon.ico).*)`. Esa lista excluye `favicon.ico` a
propósito: todo lo que entra al proxy ejecuta `supabase.auth.getUser()`, que es una
llamada de red. Los tres SVG nuevos caerían dentro del matcher y pagarían ese costo en
cada carga de página. El matcher pasa a:

```
'/((?!_next/static|_next/image|favicon.ico|icon.svg|logo.svg|logo-mark.svg).*)'
```

No es un problema de correctitud —el proxy solo redirige en `/dashboard` y `/portal`,
así que los assets se sirven bien igual— sino de latencia evitable.

## Cambios de nombre

| Archivo | Qué cambia |
|---|---|
| `src/app/layout.tsx` | `title: "AGServicios"` → `"Servicios AGE"` |
| `src/app/dashboard/layout.tsx` | Marca de la nav + `<img>` del logo |
| `src/app/login/page.tsx` | Encabezado + lockup del logo |
| `src/app/portal/layout.tsx` | Marca de la nav + `<img>` del logo |
| `src/app/dashboard/page.tsx` | "catálogo de AGServicios" |
| `src/app/portal/page.tsx` | "el equipo de AGServicios" |
| `src/app/api/reports/catalog/route.ts` | `catalogo-agservicios.csv` → `catalogo-servicios-age.csv` |
| `src/proxy.ts` | `matcher`: excluir los tres SVG (ver sección Logo) |
| `README.md` | Título y prosa |
| `docs/manual-usuario.md` | Título y prosa |
| `package.json` | `name: "agservicios-web"` → `"servicios-age-web"` (+ `package-lock.json`) |
| `AGENTS.md` | **Nueva** sección "Marca" con el mapeo del carve-out |

## Riesgos

- **Bajo.** Ningún test unitario ni E2E hace aserciones sobre el nombre de marca ni
  sobre colores (verificado por búsqueda en `tests/`), así que la suite existente no
  necesita cambios y sirve de red de seguridad.
- El riesgo real es de **regresión visual**, no funcional: un token mal cableado o un
  `<img>` con ruta rota. Lo cubre la verificación manual con capturas.
- `--accent-weak` y `--accent-ink` cambian de tono pero conservan su rol, así que
  cualquier consumidor que se haya pasado por alto sigue renderizando de forma
  coherente en vez de romperse.

## Verificación

- `npm run lint`, `npm run test:unit`, `npm run build` en verde.
- `npm run test:e2e` en verde — recorre login, dashboard y portal, así que detecta un
  `.brand-mark` roto o un asset faltante.
- Comprobación visual manual, ejecutando la app y capturando: **login**, **dashboard**
  (con tablas y chips de estado), **portal**. Se revisa que no quede ningún ámbar del
  acento viejo y que los cinco chips de estado se sigan distinguiendo entre sí.
- Búsqueda final de `AGServicios` para confirmar que lo único que queda es el carve-out
  documentado.

## Secuencia de implementación (para el plan)

1. **Tokens:** reescribir la paleta en `globals.css`, incluidos los chips de estado y
   la eliminación de la retícula. La app queda funcional y ya reverdecida.
2. **Assets:** crear los tres SVG, borrar los sobrantes del starter, cablear
   `.brand-mark` al `<img>` y el favicon, y excluir los SVG en el matcher de
   `src/proxy.ts`.
3. **Nombre:** las siete superficies de código más README, manual y `package.json`.
4. **Registro:** sección "Marca" en `AGENTS.md`.
5. **Verificación:** lint, unit, build, E2E y capturas.

Cada paso deja la app funcional.
