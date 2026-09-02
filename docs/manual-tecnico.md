# Manual técnico — Servicios AGE

Documento de referencia para quien tenga que mantener, extender o retomar este
proyecto. Recoge el stack, el modelo de datos, el esquema de autorización, el
procedimiento de migraciones, la configuración de entorno, el arranque local, el
despliegue, la estrategia de pruebas y los límites conocidos del alcance.

Los diagramas viven en [`arquitectura.md`](arquitectura.md) y no se repiten aquí;
este documento remite a ellos. El manual dirigido al personal de la empresa es
[`manual-usuario.md`](manual-usuario.md).

**Estado del sistema.** El código está completo para el alcance definido y
desplegado, pero el sistema **no ha entrado en uso**. No hay usuarios internos, no
hay empresas cliente con acceso al portal y no se ha cargado ningún dato de
negocio: lo único que ha existido en las bases son semillas de desarrollo y de
pruebas. No ha ocurrido una entrega formal.

---

## 1. Stack

| Pieza | Versión | Notas |
|---|---|---|
| Next.js | 16.2.11 | App Router, Server Components, Server Actions |
| React | 19.2.4 | |
| TypeScript | 5 | modo `strict` |
| Supabase | `supabase-js` 2, `@supabase/ssr` 0.12 | Postgres, Auth y Row Level Security |
| Tailwind CSS | 4 | `@import "tailwindcss"` más `@theme inline` |
| Vitest | 4 | pruebas unitarias |
| Playwright | 1.61 | pruebas de extremo a extremo |

Dos advertencias que ahorran tiempo a quien llegue nuevo:

- **La versión de Next es la 16, y `package.json` es la fuente autoritativa.**
  Cualquier documentación heredada que diga «Next.js 15» está equivocada.
- **El middleware se llama `src/proxy.ts`, no `middleware.ts`.** Es un cambio de
  Next 16. Buscar `middleware.ts` en este repositorio no devuelve nada, y la
  conclusión errónea sería que no hay middleware.

Next 16 introduce cambios incompatibles respecto de versiones anteriores. Antes de
escribir código conviene consultar la documentación que viene con la dependencia,
en `node_modules/next/dist/docs/`.

**No hay ORM.** El acceso a datos es el cliente `supabase-js` con los tipos
generados en `src/lib/database.types.ts`. Ese archivo se regenera tras cada cambio
de esquema y **no se edita a mano**. Tampoco hay biblioteca de componentes externa:
el sistema visual completo vive en `src/app/globals.css`. El alias de importación
es `@/*` hacia `./src/*`.

### Frontera de código exclusivo de servidor

`src/lib/supabase/admin.ts` reexporta `admin-core.ts` añadiéndole
`import 'server-only'`. El código de la aplicación importa `admin.ts`, de modo que
incluir el cliente de rol de servicio en un componente de cliente es un error de
compilación, que es exactamente el efecto buscado.

Los scripts autónomos que se ejecutan bajo `tsx` importan `admin-core.ts`
directamente, porque no pasan por el empaquetador. **No conviene «corregir» esas
importaciones** para que apunten a `admin.ts`: `server-only` lanzaría un error
fuera del proceso de compilación de Next.

---

## 2. Modelo de datos

El diagrama entidad-relación completo está en
[`arquitectura.md`, sección 1](arquitectura.md#1-modelo-de-datos). Aquí se
describe qué representa cada tabla y qué decisiones lleva encima.

- **`profiles`** — extiende `auth.users`. Campos `full_name`, `role` y `client_id`.
  El rol es uno de `admin`, `empleado` o `cliente`. Un perfil lleva `client_id`,
  apuntando a `clients`, **si y sólo si su rol es `cliente`**: lo impone la
  restricción `profiles_portal_role` (ver más abajo).
- **`clients`** — nombre, correo, teléfono, dirección y `active`.
- **`locations`** — las sedes o tiendas de un cliente: `client_id`, `name`,
  `address` (admite nulo), `active` y `created_at`. **El nombre es único por
  cliente, no globalmente**, de modo que dos clientes distintos pueden tener cada
  uno una sede llamada «Centro».
- **`brands`** — marcas de fabricante: nombre único, descripción y `active`.
- **`machine_types`** — categorías de maquinaria: nombre único, descripción y
  `active`.
- **`machines`** — nombre, `serial_number`, `asset_number`, `model`, `brand_id`,
  `type_id`, `client_id`, `location_id` y `active`.
- **`maintenances`** — `machine_id`, `technician_id`, `location_id`, `date`
  (admite nulo), `description`, `is_corrective`, `hour_meter`, `cost_subtotal`,
  `tax_amount`, `cost_total`, `report_ref`, `quote_ref`, `status` y `created_at`.
  El estado es uno de `solicitado`, `programado`, `en_proceso`, `completado` o
  `cancelado`.

### `location_id` significa dos cosas distintas, a propósito

En `machines` es la ubicación **actual** y es mutable: los clientes son cadenas con
varias tiendas y se prestan las máquinas entre ellas. En `maintenances` es una
**instantánea** de dónde estaba la máquina cuando se realizó el trabajo, y **no se
resincroniza nunca**. Si se resincronizara, trasladar una máquina reescribiría el
histórico y el reporte por tienda del año pasado cambiaría solo.

Al crear un mantenimiento el valor se rellena desde la máquina y queda editable; el
formulario únicamente propone un valor nuevo si se cambia de máquina.

**Se descartó una tabla de historial de asignación.** La instantánea en
`maintenances` produce los reportes históricos correctos, que era el objetivo. Un
historial temporal completo cuesta más y responde una pregunta que el negocio
todavía no hace: dónde estuvo esta máquina en marzo, aunque no se le haya hecho
nada.

**Las sedes archivadas siguen apareciendo** en un formulario que ya las referencia,
marcadas como `(archivada)`. Sin ese comportamiento, editar un campo no relacionado
anularía en silencio una instantánea histórica.

### Costos: montos, no tasas

La columna `cost` original se eliminó y en su lugar están `cost_subtotal` y
`tax_amount`, ambas `numeric(12,2)` y con nulos permitidos, más `cost_total` como
**columna generada y almacenada**, no escribible. La base la calcula así: si
subtotal e impuesto son ambos nulos el total es nulo; en cualquier otro caso es la
suma tratando el ausente como cero.

Se guarda el **monto** del impuesto y no la tasa, para que los registros ya
emitidos sobrevivan a un cambio del IVA nacional y sigan cuadrando con la boleta de
ese día. El formulario propone el 13 % del subtotal y lo deja editable; en cuanto
alguien toca el campo deja de recalcularse solo, para que un valor escrito a mano
no desaparezca al corregir el subtotal. La constante vive en `src/lib/maintenances.ts`.

**Convención de IVA, vinculante:** `tax_amount` vacío significa **monto no
digitado** —un registro incompleto—, no exento. Un servicio exento se registra con
`tax_amount = 0`. La justificación operativa está en el
[manual de usuario](manual-usuario.md).

### Unicidad: dos índices parciales

**`machines.serial_number`** es el número del fabricante, opcional, y es único
mediante un **índice parcial** restringido a los valores no nulos. Una restricción
`unique` corriente habría sido más simple y equivocada: obliga a inventar rellenos
como `SIN-SERIE-1` en máquinas que genuinamente no tienen serie, y esos rellenos
acaban siendo permanentes y saliendo en los reportes. Ya era una columna con nulos
permitidos desde el esquema inicial; lo que faltaba era la unicidad, y la migración
lo hace constar en un comentario en vez de emitir un `drop not null` inocuo.

**`asset_number`** es la placa de inventario del cliente y **no tiene unicidad
alguna**: cada cliente numera por su cuenta y la misma placa aparece legítimamente
en clientes distintos.

**`profiles_client_id_unique`** es un índice único parcial sobre
`profiles(client_id) where client_id is not null`: **un cliente puede tener a lo
sumo un acceso al portal**. Sin él, dos altas concurrentes crearían dos perfiles y
la baja del cliente —que busca el perfil con `.maybeSingle()`— fallaría en
silencio. No debe eliminarse, ni debe relajarse el `.maybeSingle()` a `.limit(1)`
para esquivar un duplicado.

### Cadenas vacías

Las Server Actions escriben `null`, nunca `''`, en los campos de texto que admiten
nulo: `serial_number`, `asset_number`, `report_ref`, `quote_ref` y `address`. Con
cadena vacía, la segunda máquina sin número de serie chocaría contra el índice
único parcial, y los reportes mezclarían vacío con nulo.

---

## 3. Autorización en tres capas

La decisión de diseño más importante del proyecto: **la autorización vive en la
base de datos, no en las rutas.** La secuencia completa, con el detalle de qué capa
detiene qué, está en
[`arquitectura.md`, sección 3](arquitectura.md#3-autorización-en-tres-capas).

La primera implementación decidía el acceso por ruta. Un `cliente` podía navegar a
`/dashboard/brands` y la página cargaba, porque las tablas eran legibles por
cualquier sesión autenticada. **Un fallo de acceso no se corrige añadiendo una
comprobación de ruta; se corrige en la política.**

1. **`src/proxy.ts`** (middleware de Next 16) — refresca la sesión y redirige a
   `/login` si no hay usuario en `/dashboard` o `/portal`. No examina el rol.
   El `matcher` excluye los recursos de marca; **si se agrega o renombra un recurso
   bajo `public/` o `src/app/`, hay que excluirlo ahí**, o cada petición por ese
   archivo paga una llamada de autenticación a Supabase.
2. **Guardas de ruta** en `src/lib/auth.ts`: `requireUser`, `requireAdmin`,
   `requireStaff` y `requireClient`, que redirigen según el rol. Existen como
   primer filtro porque producen mejores errores que un resultado vacío. **No hacen
   cumplir nada.**
3. **RLS en Postgres**, más privilegios de mínimo. Esto es lo que realmente
   protege. Las funciones auxiliares son `security definer` —`is_admin()`,
   `is_staff()`, `current_client_id()`— para evitar consultas recursivas contra
   `profiles`; **no debe incrustarse un `select role from profiles` dentro de una
   política**.

Reparto de accesos:

- El personal lee todo. Un `cliente` ve sólo su propia fila de `clients`, sus
  sedes, sus máquinas y los mantenimientos de esas máquinas.
- Las escrituras son sólo de personal, con una única excepción:
  `maintenances_insert_client`.
- `locations`: el personal lee y escribe; un `cliente` **sólo lee** las filas donde
  `client_id = current_client_id()`. No puede insertar ni actualizar.
- `brands` y `machine_types` conservan la lectura abierta a cualquier sesión
  autenticada, a propósito: son etiquetas de catálogo, no datos de cliente. Lo que
  la política restringe ahí es la escritura.
- Privilegios: `anon` no tiene nada, `authenticated` sólo DML, el rol de servicio
  todo. **No se amplía un privilegio para que una consulta funcione.**

El pareo entre sede y cliente en `machines` se valida en `validateLocation`
(`src/app/dashboard/machines/actions.ts`) contra la base, y no sólo en la interfaz:
una Server Action es alcanzable por POST directo.

`src/lib/permissions.ts` es lógica pura y con pruebas: `canDelete`,
`canManageUsers`, `isStaff`, `homePathForRole` y `roleChangeBlockedReason`. Sólo
`admin` borra y gestiona usuarios. **Debe mantenerse pura**: sin cliente de Supabase
y sin `async`.

### `profiles_portal_role`: un CHECK, no una política

Un perfil tiene `client_id` si y sólo si su rol es `cliente`. La restricción existe
porque `/dashboard/users` listaba todos los perfiles, accesos de portal incluidos, y
su selector de rol sólo ofrecía los roles internos: guardar sobre la fila de un
cliente convertía su acceso de portal en personal interno **conservando el
`client_id`**, es decir, en una cuenta con visibilidad sobre todos los datos.

**Va como `check` de tabla y no como política a propósito.** La acción que cambia el
rol escribe con el cliente de rol de servicio, que evita RLS por diseño, de modo que
una política sobre `profiles` no habría tocado ese camino. Un `check` sí lo alcanza,
igual que a un script bajo `tsx` o a un `psql` a mano. `profiles_update_admin_only`
queda intacta, y la validación de `roleChangeBlockedReason` en la acción existe para
dar un mensaje entendible, no para sostener el invariante.

La forma es bidireccional porque se verificó que ningún camino deja un lado sin el
otro; el razonamiento completo, con los cuatro caminos revisados, está en el
comentario de la propia migración. **Al añadir un camino que escriba `profiles`, hay
que respetar el par: ambas columnas o ninguna.**

### `maintenances_insert_client` es el único camino de escritura de un cliente

La política permite a un `cliente` insertar una fila de mantenimiento **únicamente**
sobre una máquina que sea suya y esté activa, con `status = 'solicitado'` y con
`date`, `technician_id`, `cost_subtotal`, `tax_amount`, `hour_meter`, `report_ref` y
`quote_ref` en NULL. `location_id` queda deliberadamente fuera de esa lista: el
servidor lo rellena desde la máquina, de modo que el cliente nunca elige dónde queda
registrado el trabajo.

**Toda columna nueva de `maintenances` que lleve costo, impuesto o referencia
documental tiene que sumarse a esa política como comprobación forzada a NULL, en la
misma migración que la crea.** Una columna añadida sin actualizar la política es un
agujero: el camino de inserción del cliente aceptará lo que el cliente envíe. La
octava migración es el ejemplo trabajado de esta regla: eliminó la política, alteró
la tabla y la recreó con las cinco comprobaciones nuevas.

---

## 4. Migraciones

Las migraciones viven en `supabase/migrations/` y están numeradas. Son nueve.

| # | Archivo | Qué hace |
|---|---|---|
| 1 | `20260723000000_initial_schema.sql` | `profiles`, `brands`, `machine_types`, `clients`, `machines`; `is_admin()`; RLS inicial |
| 2 | `20260723000001_grant_role_privileges.sql` | privilegios amplios sobre el esquema `public` |
| 3 | `20260723000002_tighten_grants.sql` | reduce lo anterior a mínimo privilegio |
| 4 | `20260724000000_fase2_schema.sql` | baja lógica, rol `cliente`, `maintenances` |
| 5 | `20260724000001_fase2_rls.sql` | `is_staff()`, `current_client_id()`, políticas por rol |
| 6 | `20260724000002_unique_client_portal_access.sql` | índice único parcial de acceso al portal |
| 7 | `20260724000003_fase3_maintenance_requests.sql` | estados `solicitado` y `cancelado`; `maintenances_insert_client` |
| 8 | `20260810000000_fase4_sedes_y_costos.sql` | `locations`, `asset_number`, desglose de costo, horímetro, referencias documentales, serie única parcial |
| 9 | `20260902000000_profiles_portal_role_check.sql` | restricción `profiles_portal_role`: un perfil tiene `client_id` si y sólo si su rol es `cliente` |

Reglas de trabajo:

- **Nunca se edita una migración ya aplicada.** Todo cambio de esquema es un
  archivo nuevo.
- **Vercel despliega código, no migraciones.** `supabase db push` es un paso manual
  aparte. No debe escribirse código que asuma un esquema no aplicado, ni afirmarse
  que un despliegue aplicó una migración.
- Tras cualquier cambio de esquema hay que regenerar `src/lib/database.types.ts`.

### Estado del esquema remoto

**Verificado el 2 de septiembre de 2026 contra el proyecto de Supabase en la nube:
las nueve migraciones están aplicadas y el historial local y el remoto están
alineados.** En concreto, en el remoto existen `public.locations`, la restricción
`profiles_portal_role` y las siete columnas que la migración 8 añadió a
`maintenances` —`location_id`, `hour_meter`, `cost_subtotal`, `tax_amount`,
`cost_total`, `report_ref` y `quote_ref`—.

Ese estado es el de una fecha, no una garantía permanente: **la regla de arriba
sigue vigente y es la que hay que aplicar antes de cada publicación.** La migración
8 estuvo semanas aplicada sólo en local mientras el código que la asumía ya estaba
escrito, y la documentación del proyecto arrastró ese desfase incluso después de
resolverlo. Es exactamente el fallo que el paso manual permite y que la integración
continua evitaría; hasta que exista, el orden obligatorio es `supabase db push`,
verificar el esquema remoto y sólo entonces publicar el código.

---

## 5. Variables de entorno

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de la instancia de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | llave pública del cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | llave secreta, sólo servidor |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | credenciales de administrador para las pruebas |
| `E2E_CLIENT_EMAIL` / `E2E_CLIENT_PASSWORD` | credenciales de cliente para las pruebas |

El proyecto usa el **esquema nuevo de llaves** de Supabase:
`NEXT_PUBLIC_SUPABASE_ANON_KEY` contiene una llave publicable (`sb_publishable_…`) y
`SUPABASE_SERVICE_ROLE_KEY` una llave secreta (`sb_secret_…`). **Los nombres de las
variables son sólo etiquetas**: no deben renombrarse para que coincidan con el tipo
de llave, ni debe asumirse una llave con forma de JWT heredado.

Las credenciales `E2E_ADMIN_*` las elige quien desarrolla y **deben coincidir con lo
que se pase al script de semilla del administrador**. Las `E2E_CLIENT_*` están
fijadas por `scripts/seed-portal-test.ts`; sus valores figuran en
`.env.local.example`.

Cambiar una variable de entorno en Vercel **exige un redespliegue** para que surta
efecto.

---

## 6. Arranque local

Requiere Node 20 o superior y Docker. El CLI de Supabase es una dependencia de
desarrollo y se ejecuta por `npx`; no hace falta instalarlo globalmente.

```bash
npm install
npx supabase start        # imprime API URL, anon key y service_role key
```

Copie `.env.local.example` a `.env.local` y complete los valores que imprimió
`supabase start`:

| Lo imprime como | Va en |
|---|---|
| `API URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon key` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role key` | `SUPABASE_SERVICE_ROLE_KEY` |

Después, en este orden:

```bash
npx supabase db reset
npx tsx scripts/seed-admin.ts <correo> <contraseña> "<nombre completo>"
npx tsx scripts/seed-portal-test.ts
npm run dev
```

**`seed-admin.ts` exige los tres argumentos.** Sin ellos imprime su modo de uso y
termina con código 1, dejando la base sin ningún administrador; el resto del
arranque parece haber funcionado y el primer inicio de sesión falla.

**La semilla del portal es obligatoria antes de ejecutar las pruebas de extremo a
extremo:** varias especificaciones necesitan una cuenta de cliente con al menos una
máquina, y el formulario de mantenimiento necesita una máquina que seleccionar.

Scripts disponibles: `npm run dev`, `build`, `start`, `lint`, `test:unit` y
`test:e2e`.

---

## 7. Despliegue

- **Frontend en Vercel**, con despliegue automático al publicar en la rama
  `master`.
- **Backend en Supabase cloud**, en la región `us-east-2` (Ohio), verificada el 2
  de septiembre de 2026. El identificador del proyecto y las llaves viven en las
  variables de entorno del despliegue, no en el repositorio, que es público.
- Las migraciones se aplican con `supabase db push`. Es un paso manual, separado
  del despliegue y fácil de olvidar; el diagrama de
  [`arquitectura.md`, sección 2](arquitectura.md#2-despliegue) lo señala
  explícitamente.

El nombre anterior del proyecto, *AGServicios*, sobrevive a propósito en varios
identificadores técnicos que nadie ve desde la interfaz y cuyo cambio rompería
entornos. No son errores y no deben renombrarse: el `project_id` de
`supabase/config.toml`, que nombra los contenedores Docker locales; el correo
sembrado en `scripts/seed-portal-test.ts`; los registros fechados de `docs/design/`;
y el historial de git. El repositorio de GitHub **sí** se renombró a
`servicios-age`; GitHub redirige la URL anterior, de modo que un clon antiguo sigue
funcionando.

---

## 8. Pruebas

```bash
npm run test:unit
npx playwright install     # sólo la primera vez
npm run test:e2e
```

**Unitarias (Vitest, `tests/unit/`): 40 casos** sobre `permissions.ts`,
`maintenances.ts` y `format.ts`. Son las tres piezas puras del proyecto: reglas de
rol, orden de solicitudes y cálculo del impuesto propuesto, y presentación de
importes y ausencias.

**Extremo a extremo (Playwright, `tests/e2e/`): 21 casos** en diez archivos, que
cubren autenticación, marca, CRUD de clientes, de sedes y de catálogo, máquinas,
mantenimientos, la exportación CSV del catálogo, el portal, las solicitudes y la
guarda de escalada de rol.

Tres particularidades deliberadas:

- **El aislamiento de `locations` se prueba contra PostgREST con la llave anónima,
  no contra la interfaz.** El portal no tiene pantalla de sedes, así que lo que hay
  que demostrar es que RLS aguanta cuando alguien habla directo con la API. La
  prueba de inserción exige el código de error `42501`; afirmar únicamente
  `error !== null` pasaría igual con un nombre de columna mal escrito.
- **La escalada de rol se prueba con la llave de servicio, exigiendo el código
  `23514`.** Es el camino con más privilegios que existe, así que si la restricción
  `profiles_portal_role` lo detiene ahí, lo detiene en todos. La misma
  especificación afirma además que el perfil de portal **no aparece** en
  `/dashboard/users`: sin esa tercera afirmación, revertir el filtro del listado
  dejaría pasar la batería entera, porque la restricción de la base seguiría verde.
- **Playwright corre con `workers: 1` a propósito.** Las especificaciones comparten
  un servidor de desarrollo que compila rutas bajo demanda y una única instancia
  local de Supabase; en paralelo se saturaban y producían tiempos de espera
  agotados indistinguibles de fallos reales. **No debe subirse la concurrencia para
  acelerar una ejecución.**

---

## 9. Deuda técnica declarada

Queda un punto abierto, de naturaleza técnica y asumido conscientemente.

**Las migraciones quedan fuera de la integración continua.** Hoy Vercel puede
publicar código que asume un esquema no aplicado. Falta una acción de GitHub que
ejecute `supabase db push` sobre `master` antes del despliegue. Mientras no exista
esa automatización, el orden obligatorio es `supabase db push`, verificar el esquema
remoto y recién entonces publicar.

El caso que lo demuestra ya ocurrió y **ya está resuelto**: la migración 8 estuvo
aplicada sólo en el entorno local mientras el código que la asumía ya estaba
escrito. Hoy el esquema remoto está al día (ver
[§4](#estado-del-esquema-remoto)), pero el mecanismo que permitió el desfase sigue
siendo manual, así que la deuda no se cierra con haberlo corregido una vez.

### Resuelto

**La región de la instancia de Supabase.** Estaba pendiente confirmar que no
estuviera en Europa, porque desde Costa Rica la diferencia sería de unos 150 ms por
petición. **Verificado el 2 de septiembre de 2026: el proyecto está en `us-east-2`
(Ohio), es decir Norteamérica.** El punto queda cerrado.

---

## 10. Limitaciones conocidas de alcance

- **No hay vista de detalle por máquina en el panel interno.** El personal llega al
  historial de una máquina filtrando el registro global de mantenimientos.
  Aceptable con el volumen actual de registros, menos con el que vendrá.
- **Los reportes sólo exportan CSV.** El diseño original pedía PDF; se descartó para
  no incorporar una dependencia de renderizado por algo que Excel abre igual. Si
  alguna vez un cliente necesita un documento con formato, hay que revisar esta
  decisión.
- **No se rastrean alquileres ni transacciones.** Tampoco estaban en el proyecto de
  2023 y el negocio no los necesita todavía.
- **El borrado de mantenimientos es definitivo.** La documentación heredada del
  proyecto describe los mantenimientos como archivables y no eliminables, pero el
  código no implementa ese archivado: `deleteMaintenance` en
  `src/app/dashboard/maintenances/actions.ts` ejecuta un `DELETE` físico, la tabla
  `maintenances` no tiene columna `active` en ninguna migración, y la
  política `maintenances_delete` autoriza el `DELETE` al rol `admin`.
  <!-- VERIFICAR: discrepancia entre documentación e implementación. La intención declarada (archivar, nunca borrar) está en README.md y en las reglas internas del proyecto; el comportamiento observado en actions.ts es un DELETE físico restringido a admin. Se documenta lo observado. Resolver decidiendo cuál de los dos se corrige. -->
- **Diferido a una fase posterior**, según el relevamiento interno del libro de
  Excel de la operación: lista de verificación estructurada de inspección,
  programación anual de preventivos, estados de máquina más allá de `active`,
  modelo de repuestos y aceptación firmada por el gerente de tienda. Hoy el
  mantenimiento preventivo se registra como texto libre en `description`.

---

## 11. Convenciones

**Idioma.** La interfaz, los comentarios de dominio, los nombres de las pruebas y
la documentación interna bajo `docs/` están en **español**. Lo que mira hacia
afuera —`README.md`— está en **inglés**. No deben traducirse al inglés las cadenas
de interfaz ni las descripciones de pruebas ya escritas en español, ni redactarse
en inglés texto nuevo visible por el usuario.

**Marca.** Todo texto visible dice **Servicios AGE**. El color vive íntegramente en
`src/app/globals.css` (Tailwind v4, `@theme inline`) y no hay biblioteca de
componentes externa. El verde `#16a045` (`--accent`) es sólo para elementos **no
textuales** —anillos de foco, subrayado de navegación, iconos—: da 3.41:1 sobre
blanco y no cumple AA para texto. El verde `#0d7a33` (`--accent-ink`) es el de
**texto**: 5.46:1, sí cumple. El inventario de recursos, las dimensiones y las
tablas de contraste completas están en [`marca.md`](marca.md).

**Ciclo de vida de los datos.** Clientes, máquinas, sedes, marcas y tipos se dan de
baja lógicamente (`active = false`), nunca se eliminan. Archivar un cliente además
inhabilita su acceso al portal, vetando al usuario de autenticación vinculado.
