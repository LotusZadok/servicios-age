# Fase 2: Portal de clientes + historial de mantenimientos (AGServicios)

Documento de diseño escrito el 23 de julio de 2026, antes de implementar.
Describe el alcance decidido en ese momento —portal de clientes de solo
lectura y registro de mantenimientos— y se conserva sin editar como
registro de esa decisión; el sistema actual incluye además la solicitud
de mantenimiento por el cliente (fase 3, ya anotada aquí como candidata),
con los estados `solicitado` y `cancelado` y un contador de pendientes
para el staff, y el rebranding a Servicios AGE. La otra candidata
mencionada aquí, que el cliente edite su propia ficha, no se implementó.

## Contexto

La Fase 1 (herramienta interna web para admin/empleado) está desplegada y en uso:
CRUD de clientes/máquinas/marcas/tipos, gestión de usuarios internos, reporte CSV,
sobre Next.js 16 + Supabase (Postgres + Auth + RLS), desplegado en Vercel.

La Fase 2 hace dos cosas de una vez:

1. **Completa la migración del sistema original** (`AGServicios-main`, Android/Flask/
   SQL Server) recuperando campos que quedaron fuera de la Fase 1 y adoptando el
   soft-delete que el original usaba.
2. **Añade la funcionalidad de Fase 2 propiamente dicha**: registro de
   mantenimientos (la tabla `maintenances` existía en el esquema original pero nunca
   se implementó) y un **portal de clientes** de solo lectura, con un tercer rol
   `cliente`.

Spec de Fase 1: `docs/superpowers/specs/2026-07-23-gestion-maquinaria-web-fase1-design.md`

## Objetivo

- Recuperar campos faltantes del original: `description` (marcas, tipos), `address`
  (clientes), `model` (máquinas, conservando `name`).
- Cambiar el borrado a **soft-delete** (archivar) en las entidades de catálogo.
- Relacionar cada máquina con un cliente dueño (`machines.client_id`).
- Registrar **mantenimientos** por máquina (gestión interna).
- Un **portal de cliente** (solo lectura) donde el cliente ve su ficha, sus máquinas
  y el historial de mantenimientos de cada una.
- Extender el modelo de roles a `admin | empleado | cliente` con RLS consciente del
  rol.

## Decisiones tomadas (cerradas en el brainstorming)

- **Máquina↔cliente:** una máquina pertenece a un cliente (relación 1-a-muchos vía
  `machines.client_id`, opcional; el admin asigna el dueño). "Sus máquinas" = las que
  tienen `client_id` del cliente.
- **Mantenimiento:** campos máquina, fecha, descripción, técnico responsable, tipo
  (correctivo/preventivo), costo y estado (`programado | en_proceso | completado`).
- **Borrado:** soft-delete en todas las entidades de catálogo (bandera `active`). Los
  mantenimientos no llevan `active` (son histórico; su ciclo es el `status`).
- **Acceso de cliente:** opcional, lo habilita el admin. Crea un usuario de Auth +
  perfil `role='cliente'` ligado a la ficha (`profiles.client_id`). No todos los
  clientes tienen login.
- **Portal:** solo lectura, en la misma app Next.js bajo `/portal/*`.
- **Estructura:** un solo proyecto/deploy; enrutamiento por rol.

## Fuera de alcance (candidatos a Fase 3)

- El cliente edita su propia ficha (datos de contacto).
- El cliente solicita un mantenimiento (registro en estado "solicitado" + flujo de
  aprobación del admin).
- Teléfono en usuarios internos (`users.number` del original) — se omite.
- Tablas de infraestructura del original (`DBErrors`, `EventLog`) — no se migran;
  el manejo de errores/auditoría lo cubren Supabase/Postgres y la app.

## Modelo de datos

Una nueva migración de Supabase (`supabase/migrations/`), aplicada local y a la nube
vía `supabase db push`.

### Campos nuevos y soft-delete

| Tabla | Cambios |
|---|---|
| `brands` | + `description text` · + `active boolean not null default true` |
| `machine_types` | + `description text` · + `active boolean not null default true` |
| `clients` | + `address text` · + `active boolean not null default true` |
| `machines` | + `model text` · + `client_id uuid references clients(id)` (nullable) · + `active boolean not null default true` |
| `profiles` | + `client_id uuid references clients(id)` (nullable; solo lo usan perfiles `cliente`) |
| `profiles.role` | check ampliado a `('admin','empleado','cliente')` |

### Tabla nueva `maintenances`

```
id             uuid primary key default gen_random_uuid()
machine_id     uuid not null references machines(id)
technician_id  uuid references profiles(id)          -- staff que lo realizó
date           date not null
description     text not null
is_corrective  boolean not null default false        -- true=correctivo, false=preventivo
cost           numeric(12,2)                          -- opcional
status         text not null default 'programado'
                 check (status in ('programado','en_proceso','completado'))
created_at     timestamptz not null default now()
```

El cliente de un mantenimiento se deriva de `machine_id → machines.client_id` (no se
duplica).

### Comportamiento soft-delete

- "Eliminar" pasa a **archivar**: `UPDATE ... SET active=false`.
- Todas las consultas de listado filtran `active = true`.
- Los registros archivados conservan sus referencias (una máquina archivada sigue
  ligada a su cliente y a su historial de mantenimientos).

## Autenticación y roles

- Roles: `admin`, `empleado`, `cliente`. Los dos primeros son "staff" (uso interno);
  `cliente` es externo (portal).
- Un perfil `cliente` se liga a una ficha mediante `profiles.client_id`.
- El `role` sigue tipado de forma estrecha en la app: `Role = 'admin' | 'empleado' |
  'cliente'` en `src/lib/permissions.ts`, y `requireUser` narrowea el `role` de la
  fila de perfil (como en Fase 1).

## Permisos y RLS (consciente del rol)

Las políticas de Fase 1 (`select ... to authenticated using (true)`) filtrarían datos
a los clientes; se rediseñan por rol. Se añaden helpers `security definer` (como el
`is_admin()` existente):

- `is_staff()` → `role ∈ {admin, empleado}` para el usuario actual.
- `current_client_id()` → el `client_id` del perfil del usuario actual (o null).

### Políticas por tabla

| Tabla | SELECT | INSERT / UPDATE | Archivar / DELETE |
|---|---|---|---|
| `profiles` | staff: todos · cliente: solo el suyo (`id = auth.uid()`) | admin (update) | — |
| `clients` | staff: todos · cliente: solo su ficha (`id = current_client_id()`) | staff | archivar: admin (capa de acción) |
| `machines` | staff: todas · cliente: solo las suyas (`client_id = current_client_id()`) | staff | archivar: admin (capa de acción) |
| `maintenances` | staff: todos · cliente: solo los de sus máquinas (`machine_id in (select id from machines where client_id = current_client_id())`) | staff | delete: admin |
| `brands`, `machine_types` | cualquier autenticado (son etiquetas de catálogo) | staff | archivar: admin (capa de acción) |

Notas:
- El archivado (poner `active=false`) se restringe a **admin** en la capa de server
  action vía `canDelete`, igual que el delete de Fase 1. RLS permite a staff hacer
  UPDATE (para editar); la restricción "solo admin archiva" vive en la acción porque
  RLS por columna es engorroso. Este es el mismo patrón defensa-en-dos-capas actual.
- **Defensa en profundidad:** además de RLS, las consultas del portal filtran
  explícitamente por `current_client_id`.
- `brands`/`machine_types` quedan legibles por cualquier autenticado (incluido
  `cliente`) porque solo son nombres/etiquetas que el portal necesita para mostrar la
  marca y el tipo de las máquinas del cliente; no son datos sensibles.

## Funcionalidad interna (dashboard admin/empleado)

### Ajustes a los CRUD existentes
- Marcas / Tipos: campo `description` en formularios y listas.
- Clientes: campo `address`.
- Máquinas: campo `model` y select **"Cliente dueño"** (opcional).
- Soft-delete: listas filtran `active=true`; "Eliminar" → "Archivar" (admin), hace
  `active=false`.

### Gestión de mantenimientos (nueva sección)
- Ítem de nav **"Mantenimientos"** (staff).
- CRUD: lista (con filtro por máquina y por estado), nuevo, editar. Formulario:
  máquina (select), técnico (select de staff), fecha, tipo correctivo/preventivo,
  costo, estado, descripción.
- La ficha interna de una máquina muestra su historial de mantenimientos.
- Crear/editar: admin y empleado. Borrar: admin.

### Provisión de acceso al portal
- En la edición de un cliente: botón **"Habilitar acceso al portal"** (admin).
- Acción service-role (admin-only): crea usuario de Auth (correo del cliente +
  contraseña temporal) + perfil `role='cliente'` con `client_id` de la ficha.
  Reutiliza el patrón `createUser` de Fase 1 (con rollback del usuario huérfano si
  falla el insert de perfil).
- Si el cliente ya tiene acceso, se muestra su estado en vez del botón.

## Portal del cliente (`/portal/*`, solo lectura)

### Enrutamiento por rol
En el `proxy` (middleware) y en los redirects de login/raíz:
- `cliente` → `/portal`; si intenta `/dashboard/*`, redirige a `/portal`.
- `admin`/`empleado` → `/dashboard`; si intentan `/portal/*`, redirige a `/dashboard`.
- `/` y post-login redirigen según el rol.

### Páginas
- **`/portal`** (inicio): ficha del cliente (nombre, correo, teléfono, dirección) +
  lista de sus máquinas (nombre, modelo, marca, tipo).
- **`/portal/machines/[id]`**: detalle de la máquina + historial de mantenimientos
  (fecha, tipo, descripción, costo, estado, técnico). Solo lectura.
- Layout propio del portal (header con nombre del cliente + salir), reutilizando el
  sistema de diseño "Engineered" actual.

### Seguridad
- RLS limita por `current_client_id`; las consultas además filtran explícitamente.
- Un `cliente` nunca ve datos de otro cliente ni el dashboard interno.

## Testing

- **Unit (Vitest):** helpers de permisos (`isStaff`, `isClient`, `canDelete`,
  `canManageUsers`) y una función pura de redirect-por-rol (`homePathForRole`).
- **E2E (Playwright):**
  - Un `cliente` inicia sesión → llega a `/portal`, ve solo sus máquinas, y al
    intentar `/dashboard` es redirigido a `/portal`.
  - Staff registra un mantenimiento y aparece en el historial de la máquina.
  - Archivar (soft-delete) oculta un registro de la lista pero conserva el histórico.
- Se mantiene el enfoque de Fase 1: camino feliz + separación de permisos por rol, no
  cobertura exhaustiva.

## Despliegue

- Migración nueva aplicada a la nube con `supabase db push` (además del auto-deploy de
  código en Vercel al hacer push a GitHub).
- Sin cambios de infraestructura: mismo proyecto Supabase y mismo proyecto Vercel.
- Las llaves nuevas (publishable/secret) siguen igual.

## Secuencia de implementación (para el plan)

El diseño es único pero se implementa por capas verificables:

1. **Esquema + RLS:** migración (campos, soft-delete, `client_id`, `maintenances`,
   rol `cliente`), helpers `is_staff()`/`current_client_id()`, políticas por rol,
   regenerar tipos.
2. **Ajustes internos:** campos nuevos en los CRUD, soft-delete (archivar), sección de
   mantenimientos, provisión de acceso de cliente.
3. **Portal + enrutamiento por rol + tests:** `/portal`, redirects por rol en el
   proxy/login, E2E del cliente y de mantenimientos.

Cada capa deja la app funcional y desplegable.
