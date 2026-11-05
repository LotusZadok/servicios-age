> **Documento de uso del desarrollador, no de la empresa.** Resume el proyecto en
> los términos en que se defendería ante una revisión técnica. No es material de
> entrega ni contiene información comercial.

# Resumen técnico — Servicios AGE

## El problema

Servicios AGE da mantenimiento a maquinaria industrial —principalmente
montacargas— para empresas en Costa Rica, y registraba cada trabajo en un libro de
Excel. El libro guardaba bien lo ocurrido y mal todo lo posterior: recuperar el
historial de un cliente exigía filtrar a mano, los trabajos programados se pasaban
porque nada los mostraba, y responder «¿cuándo toca mi máquina?» requería que
alguien abriera el archivo y leyera.

El caso que justificó el proyecto es más estrecho que «digitalizar el Excel»:
**mostrarle a un cliente el trabajo hecho sobre una máquina en un período, sin
reconstruir el reporte a mano.** Esa frase es la que decide varias de las
decisiones que siguen.

**Antecedente.** Existe un proyecto universitario de 2023 (TEC, curso de ingeniería
de software) llamado `AGServicios-main`: aplicación Android en Kotlin, API en Flask
y SQL Server con 26 procedimientos almacenados detrás de una API que armaba cada respuesta JSON campo por campo; el cliente
Android apuntaba a un túnel ngrok fijo en el código, las contraseñas se cifraban a
mano con bcrypt en la API, y la batería de pruebas era un único caso de humo contra
`/login`. Nunca se usó. Yo llevaba la capa de base de datos en ese equipo, de modo
que esos 26 procedimientos eran míos. Esta versión no comparte código con aquella:
lo único que sobrevivió fue el modelo de dominio —clientes, máquinas, marcas,
tipos—, porque esa parte estaba bien.

---

## Cinco decisiones defendibles

### 1. La autorización vive en Postgres, no en las rutas

La primera implementación decidía el acceso por ruta: el portal renderizaba vistas
de cliente, el panel vistas de personal, y el acceso quedaba determinado por la
página a la que se llegara. Al navegar como cliente a la pantalla de marcas, cargó.
Las tablas de debajo eran legibles por cualquier sesión autenticada y nada por
debajo de la ruta detenía a nadie.

La corrección no fue añadir una comprobación más de ruta, sino dejar de tratar la
ruta como frontera. La autorización pasó a políticas de row-level security con
privilegios de mínimo, de modo que la consulta misma no devuelve lo que a la sesión
no le corresponde, sin importar qué página la emitió. Las guardas de ruta se
quedaron como primer filtro —producen mejores errores que un resultado vacío— pero
ya no hacen cumplir nada.

**Lo que hay que saber decir en una revisión** es qué capa detiene qué. Ante una
petición de un `cliente` a `/dashboard/brands`, el middleware sólo comprueba que
haya sesión y deja pasar; quien impide que la pantalla se muestre es `requireStaff`
en el layout, con una redirección. La frontera real sólo se ve cuando la petición
evita la aplicación y habla directo con la API: ahí la política es lo único que
responde. Conviene además no exagerar el alcance: `brands` y `machine_types`
conservan la lectura abierta a propósito, porque son etiquetas de catálogo y no
datos de cliente; lo que RLS restringe sobre ellas es la escritura.

### 2. La sede de un mantenimiento es una instantánea

Los clientes son cadenas con varias tiendas y se prestan las máquinas entre ellas.
Tanto `machines` como `maintenances` llevan `location_id`, y significan cosas
distintas: en `machines` es la ubicación actual y es mutable; en `maintenances` es
dónde se realizó el trabajo, capturada en el momento y nunca resincronizada.

El argumento es directo: si fuera una referencia viva, prestar una máquina
reescribiría su historial completo, y mostrar ese historial es la razón por la que
existe el proyecto. Una decisión de modelado que se justifica por el caso de uso, no
por elegancia.

### 3. El total es una columna generada; el impuesto se guarda como monto

`maintenances` descompone el costo en `cost_subtotal` y `tax_amount`, con
`cost_total` como columna generada y almacenada. Guardar el **monto** del impuesto
en vez de la tasa significa que un cambio del IVA nacional no altera
retroactivamente registros ya facturados: cada uno sigue coincidiendo con la boleta
emitida ese día.

`tax_amount` distingue NULL de cero, y la distinción es funcional: NULL significa
que nadie ha digitado el impuesto todavía, `0` significa que el servicio es exento.
El total generado sigue la misma regla —nulo sólo cuando subtotal e impuesto lo son
ambos, y en cualquier otro caso la suma tratando el ausente como cero—, lo que hace
imposible que la aplicación y la base discrepen sobre el total.

### 4. Dos índices únicos parciales, ninguno accidental

`machines.serial_number` es único mediante un índice parcial restringido a valores
no nulos. Una restricción `unique` corriente habría sido más simple y equivocada:
obliga a inventar rellenos tipo `SIN-SERIE-1` en máquinas que genuinamente no tienen
serie, y esos rellenos son permanentes y aparecen en los reportes. `asset_number`,
la placa de inventario del cliente, no lleva unicidad alguna: cada cliente numera
por su cuenta y la misma placa se repite legítimamente entre clientes.

`profiles_client_id_unique` es un índice único parcial sobre `client_id` donde no es
nulo: un cliente tiene a lo sumo un acceso al portal. Es parcial porque los perfiles
internos tienen `client_id` nulo y no deben restringirse entre sí. El fallo que
previene es concreto y silencioso: dos altas concurrentes crearían dos perfiles, y
la baja del cliente —que busca el perfil vinculado con `.maybeSingle()`— fallaría sin
avisar, dejando un acceso activo.

### 5. Un `check` de tabla no es una política, y por eso sirve aquí

La pantalla de gestión de usuarios listaba todos los perfiles, incluidos los
accesos al portal de los clientes, y su selector de rol sólo ofrecía los roles
internos: guardar sobre la fila de un cliente convertía su acceso de portal en
personal interno **conservando el `client_id`**, es decir, en una cuenta con
visibilidad sobre los datos de todos los clientes.

Lo interesante es dónde **no** iba la corrección. La acción que cambia el rol
escribe con el cliente de rol de servicio, que evita RLS por diseño, así que una
política nueva sobre `profiles` no habría tocado ese camino —y habría dado la
falsa impresión de que sí—. La restricción `check ((role = 'cliente') = (client_id
is not null))` sí lo alcanza, porque `service_role` evita el row-level security
pero no las restricciones de tabla; y con ella también quedan cubiertos un script
bajo `tsx` y un `psql` a mano. La validación en la acción y el filtro del listado
existen para dar un mensaje entendible y quitar la trampa de la pantalla, no para
sostener el invariante.

Que la restricción pudiera escribirse bidireccional no fue una preferencia: hubo
que comprobar antes que ningún camino deja un lado sin el otro —la clave foránea no
declara `on delete`, los clientes se archivan en vez de borrarse, y el borrado de
una cuenta se lleva la fila entera por cascada—.

---

## Qué se descartó, y por qué

| Descartado | Razón |
|---|---|
| Los 26 procedimientos almacenados de 2023 | Lo primero que hice fue borrar mi propio trabajo. Código de aplicación con tipos generados se cambia más fácil y se puede probar. |
| Autorización decidida por ruta | Demostradamente insuficiente: la pantalla de marcas cargaba para un cliente. |
| Tabla de historial de asignación de máquinas | La instantánea en `maintenances` ya da los reportes históricos correctos. Un historial temporal completo cuesta más y responde una pregunta que el negocio todavía no hace: dónde estuvo esta máquina en marzo aunque no se le haya hecho nada. |
| Columna `cost` única | Sustituida por subtotal, impuesto y total generado. Se eliminó de golpe porque la base estaba vacía: pagar una migración de datos después no habría comprado nada. |
| Reportes en PDF | Estaban en el diseño original. Se descartaron para no incorporar una dependencia de renderizado por algo que Excel abre igual. Si un cliente necesita un documento con formato, hay que revisarlo. |
| Logo en SVG | El arte de origen es raster y la aplicación lo usa en tamaños fijos: tres PNG y un ICO renderizados a su tamaño pesan unos 32 KB en total y son más nítidos que escalar en tiempo de ejecución. |
| ORM | `supabase-js` con tipos generados. Una capa menos entre el código y las políticas que hacen cumplir la autorización. |
| Biblioteca de componentes | El sistema visual completo cabe en un archivo CSS. |
| Alquileres y transacciones | No estaban en el proyecto de 2023 y el negocio no los necesita. |

---

## Cobertura de pruebas

**40 pruebas unitarias** (Vitest) sobre las tres piezas puras del proyecto:
`permissions.ts` —reglas de rol—, `maintenances.ts` —orden de solicitudes y cálculo
del impuesto propuesto— y `format.ts` —presentación de importes y ausencias—.
Mantenerlas puras, sin cliente de Supabase y sin `async`, es lo que las hace
verificables sin infraestructura.

**21 pruebas de extremo a extremo** (Playwright) en diez archivos: autenticación,
marca, CRUD de clientes, sedes y catálogo, máquinas, mantenimientos, exportación
CSV, portal y solicitudes.

Dos detalles del diseño de la batería que valen más que el número:

- **El aislamiento de `locations` se prueba contra PostgREST con la llave anónima,
  no contra la interfaz.** El portal no tiene pantalla de sedes, así que probar la
  interfaz no demostraría nada; lo que hay que demostrar es que RLS aguanta cuando
  alguien habla directo con la API. La prueba de inserción exige el código de error
  `42501`: afirmar únicamente `error !== null` pasaría igual con un nombre de
  columna mal escrito, y esa es la diferencia entre una prueba que verifica y una
  que acompaña.
- **Playwright corre con un solo worker a propósito.** Las especificaciones
  comparten un servidor de desarrollo que compila rutas bajo demanda y una única
  instancia local de Supabase; en paralelo se saturaban y producían tiempos de
  espera agotados indistinguibles de fallos reales. Una batería lenta y fiable vale
  más que una rápida y ambigua.

**Lo que no está cubierto** y conviene reconocer antes de que lo pregunten: no hay
pruebas sobre el camino de borrado de mantenimientos, que es donde la
implementación y la documentación del proyecto discrepan —la documentación describe
un archivado y el código ejecuta un borrado físico—.
