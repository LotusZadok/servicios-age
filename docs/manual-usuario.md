# Manual de usuario — Servicios AGE

Herramienta interna de gestión de maquinaria: clientes, máquinas, catálogo,
mantenimientos y un portal de solo lectura para clientes.

---

## 1. Roles y qué puede hacer cada uno

| Rol | Acceso | Puede |
|---|---|---|
| **admin** | Panel interno (`/dashboard`) | Todo: crear/editar clientes, sedes, máquinas, marcas, tipos y mantenimientos; **archivar** registros; gestionar usuarios internos; habilitar acceso al portal a clientes; descargar reportes. |
| **empleado** | Panel interno (`/dashboard`) | Crear y editar clientes, sedes, máquinas, marcas, tipos y mantenimientos. **No** puede archivar registros, ni gestionar usuarios, ni habilitar acceso a clientes. |
| **cliente** | Portal externo (`/portal`) | Solo lectura: ver su ficha, sus máquinas y el historial de mantenimientos de cada una. No ve nada de otros clientes ni el panel interno. |

Cada quien entra por la **misma pantalla de login**; el sistema lo lleva
automáticamente a su área según el rol (staff → panel; cliente → portal). Un
cliente que intente abrir el panel interno es redirigido a su portal, y viceversa.

---

## 2. Ingreso

1. Abre la aplicación → te lleva a **Iniciar sesión**.
2. Ingresa correo y contraseña.
3. Según tu rol, llegas al **Panel** (admin/empleado) o al **Portal** (cliente).
4. "Salir" cierra la sesión.

Las cuentas de acceso las crea siempre un administrador (no hay auto-registro).

---

## 3. Catálogo interno (admin / empleado)

### Clientes
Campos: **nombre** (obligatorio), correo, teléfono, dirección.

### Sedes
Las tiendas o sucursales de un cliente. Campos: **cliente** (obligatorio),
**nombre** (obligatorio) y dirección. El nombre solo tiene que ser único dentro
del cliente: dos clientes pueden tener cada uno una sede "Centro".

### Máquinas
Campos: **nombre** (obligatorio), número de serie, **número de activo**,
**modelo**, **marca**, **tipo**, **cliente dueño** (opcional) y **sede actual**
(opcional). La marca y el tipo se eligen de listas; deben existir antes de crear
la máquina.

- El **número de serie** es del fabricante. Es opcional, pero si se llena no
  puede repetirse en otra máquina.
- El **número de activo** es la placa de inventario del cliente. Puede repetirse
  entre clientes.
- La **sede actual** es dónde está la máquina *hoy*: cámbiala cuando se preste a
  otra tienda. Solo se ofrecen las sedes del cliente dueño, así que hay que
  elegir el cliente primero.

### Marcas y Tipos de maquinaria
Campos: **nombre** (obligatorio) y descripción.

### Crear / Editar / Archivar
- **Crear** y **Editar**: admin y empleado.
- **Archivar** (ver sección 4): solo admin.

---

## 4. Archivar (borrado suave)

El botón **"Archivar"** reemplaza al "eliminar" tradicional: **no borra** el
registro, lo marca como inactivo. Esto conserva el historial y evita romper
referencias (por ejemplo, mantenimientos ligados a una máquina).

- Solo un **admin** puede archivar.
- Los registros archivados **desaparecen de las listas** internas y de los
  selectores (marca/tipo/cliente/sede). Excepción a propósito: si una máquina o
  un mantenimiento ya apuntaba a una sede archivada, esa sede sigue apareciendo
  en su formulario, marcada como *(archivada)*, para que editar cualquier otro
  campo no la borre en silencio.
- Los datos y su historial se conservan en la base de datos.

### Archivar un cliente = darlo de baja
Cuando archivas un **cliente**, además de ocultarlo de las listas:
- Se **deshabilita su acceso al portal** (si lo tenía): su login queda bloqueado y
  ya no puede iniciar sesión ni ver sus datos.
- Sus máquinas y mantenimientos se conservan, pero dejan de mostrarse en el portal.

> Nota: no hay (todavía) una pantalla para "desarchivar". Reactivar un cliente o su
> acceso requiere intervención técnica en la base de datos.

---

## 5. Mantenimientos (admin / empleado)

Sección **"Mantenimientos"** del panel. Cada registro tiene:

- **Máquina** (obligatoria)
- **Sede donde se atendió** (opcional)
- **Descripción** (obligatoria)
- **Fecha**
- **Técnico responsable** (un usuario admin/empleado; opcional)
- **Tipo**: correctivo o preventivo
- **Estado**: programado / en proceso / completado
- **Horímetro**: la lectura tomada en la visita
- **Subtotal**, **impuesto** y **total**
- **N.º de boleta o reporte** y **N.º de proforma**

La **sede** se propone sola a partir de la ubicación actual de la máquina, pero
queda editable y luego **no vuelve a cambiar**: es la foto de dónde se hizo ese
trabajo. Si la máquina se presta después a otra tienda, el historial sigue
diciendo dónde se atendió, que es lo que hay que poder mostrar.

El **impuesto** se propone al 13 % del subtotal y es editable, para trabajos
exentos o boletas que no cuadran al centavo. Se guarda el **monto**, no la tasa:
si el IVA cambia, los mantenimientos ya registrados siguen coincidiendo con la
boleta que se emitió ese día. El **total** lo calcula el sistema (subtotal +
impuesto) y no se escribe a mano.

> **Dejar el campo de impuesto vacío no significa "exento".** Vacío significa
> que el monto del impuesto **todavía no se ha digitado**: es un dato faltante,
> no un cero. Un servicio realmente **exento se registra con impuesto `0`**.
>
> La diferencia importa al leer los reportes: un mantenimiento con impuesto
> vacío aparece sin monto de impuesto y su total se calcula solo con el
> subtotal, pero eso es un registro incompleto que alguien debe terminar de
> llenar. Uno con impuesto `0` está completo y afirma que no se cobró impuesto.
> Si ambos están vacíos —subtotal e impuesto— el total también queda vacío: es
> un mantenimiento aún sin facturar.

El **cliente** de un mantenimiento se deduce de la máquina (la máquina ya tiene su
cliente dueño), así que no se captura por separado.

- **Registrar / editar**: admin y empleado.
- **Eliminar**: solo admin.

Los mantenimientos aparecen en el portal del cliente dueño de la máquina.

### Solicitudes de clientes (estado "solicitado")
Un cliente puede **solicitar** un mantenimiento desde el portal, en la página de su
máquina (solo una descripción de lo que necesita). Llega como estado **solicitado**:
- Aparece **destacada y primero** en la lista de Mantenimientos, y la navegación
  muestra un **contador** de solicitudes pendientes (ej. "Mantenimientos (3)").
- El staff la **agenda** abriéndola y cambiando el estado a *programado*, con fecha,
  técnico y costos; o la **cancela** (estado *cancelado*) si no se realizará.
- El cliente solo puede crear la solicitud: no puede editarla ni cancelarla; ve su
  avance en el historial de la máquina.

---

## 6. Gestión de usuarios internos (solo admin)

Sección **"Usuarios"**:
- Crear un usuario con rol **admin** o **empleado** (correo + contraseña temporal).
- Cambiar el rol de un usuario existente.
- No se puede quitar el rol al **último administrador** (protección contra quedarse
  sin acceso de administración).

---

## 7. Dar acceso al portal a un cliente (solo admin)

1. Entra a **Clientes → (elige un cliente) → Editar**.
2. En la sección **"Acceso al portal"**, usa **"Habilitar acceso al portal"**:
   - Correo de acceso (por defecto, el correo del cliente).
   - Contraseña temporal (mínimo 6 caracteres).
3. Se crea un login con rol **cliente** ligado a esa ficha.
4. Si el cliente ya tiene acceso, se muestra su estado en vez del formulario.

Comparte el correo y la contraseña temporal con el cliente para que entre al portal.

> **Un solo acceso por cliente.** Cada cliente puede tener como máximo **un** login de
> portal. Si se intenta crear un segundo (por ejemplo, dos admins habilitando acceso
> a la vez, o un doble clic), la base de datos lo rechaza y verás un mensaje de error.
> Esto evita accesos duplicados que impedirían dar de baja correctamente al cliente.

---

## 8. Portal del cliente (solo lectura)

El cliente entra por el mismo login y llega a **su portal**:
- **Su información**: nombre, correo, teléfono, dirección.
- **Sus máquinas**: cada una con marca, tipo, modelo y **sede actual**.
- Al abrir una máquina: su **historial de mantenimientos** (fecha, **sede**, tipo,
  estado, descripción). La sede de cada línea es dónde se hizo *ese* trabajo, así
  que puede no coincidir con la sede actual de la máquina.

El cliente ve sus sedes, pero no las administra: las crea y edita el staff.

El cliente no ve datos de otros clientes. Sí puede **solicitar un mantenimiento**
desde la página de cada máquina (ver sección 5); editar su propia ficha se evaluará en
una fase futura.

---

## 9. Reportes

Sección **"Reportes"** → **"Descargar catálogo (CSV)"** genera un archivo con
clientes, **sedes**, máquinas (con número de activo y sede), **mantenimientos**
(con sede, horímetro, subtotal, impuesto, total y los números de boleta y
proforma), marcas y tipos. Se abre en Excel.

---

## 10. Notas de seguridad (para referencia)

- Los permisos se aplican en **dos capas**: en la aplicación (cada acción de creación
  o edición verifica que quien la ejecuta sea admin o empleado) y en la **base de
  datos** (Row Level Security). Un cliente nunca puede leer ni modificar datos de otro
  cliente, aunque intente rutas directas.
- Solo los administradores archivan registros y gestionan accesos.
- Un cliente puede tener a lo sumo un acceso al portal (restricción en la base de
  datos), lo que garantiza que archivarlo sí lo da de baja.
- Al **solicitar** un mantenimiento, la base de datos exige que el cliente no fije
  subtotal, impuesto, horímetro ni números de boleta o proforma. Esos campos los
  llena el staff: un cliente no puede escribir su propio costo ni siquiera
  saltándose la pantalla.
- Las contraseñas y llaves nunca se guardan en el código; viven en variables de
  entorno del servidor.
