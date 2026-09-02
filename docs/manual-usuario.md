# Manual de usuario — Servicios AGE

Sistema de gestión de mantenimiento de maquinaria de **Servicios AGE**. Son dos
aplicaciones sobre la misma información: un **panel interno** para el personal de
la empresa y un **portal** donde cada empresa cliente ve únicamente su propio
equipo y puede solicitar servicio.

Este manual está organizado **por rol y por tarea**. Para encontrar algo, busque el
nombre de lo que quiere hacer en el índice siguiente.

> **Estado del sistema.** La aplicación está construida y desplegada, pero
> **todavía no ha entrado en uso**. No hay cuentas de personal creadas, ninguna
> empresa cliente tiene acceso al portal y no se ha cargado información de negocio.
> Este manual describe cómo funcionará el sistema cuando se ponga en marcha.

---

## Índice de tareas

**Todos los roles**

- [Ingresar al sistema](#ingresar-al-sistema)
- [Salir](#salir)

**Personal de la empresa: empleado y administrador**

- [Registrar un mantenimiento](#registrar-un-mantenimiento)
- [Corregir un mantenimiento ya registrado](#corregir-un-mantenimiento-ya-registrado)
- [Atender una solicitud enviada por un cliente](#atender-una-solicitud-enviada-por-un-cliente)
- [Registrar un cliente nuevo](#registrar-un-cliente-nuevo)
- [Registrar una sede de un cliente](#registrar-una-sede-de-un-cliente)
- [Registrar una máquina](#registrar-una-máquina)
- [Trasladar una máquina a otra tienda](#trasladar-una-máquina-a-otra-tienda)
- [Registrar una marca o un tipo de maquinaria](#registrar-una-marca-o-un-tipo-de-maquinaria)
- [Descargar el catálogo completo para Excel](#descargar-el-catálogo-completo-para-excel)

**Sólo el administrador**

- [Crear una cuenta para alguien de la empresa](#crear-una-cuenta-para-alguien-de-la-empresa)
- [Cambiar el rol de una cuenta](#cambiar-el-rol-de-una-cuenta)
- [Eliminar una cuenta interna](#eliminar-una-cuenta-interna)
- [Dar acceso al portal a un cliente](#dar-acceso-al-portal-a-un-cliente)
- [Archivar un cliente, es decir, darlo de baja](#archivar-un-cliente-es-decir-darlo-de-baja)
- [Archivar una sede, una máquina, una marca o un tipo](#archivar-una-sede-una-máquina-una-marca-o-un-tipo)
- [Eliminar un mantenimiento](#eliminar-un-mantenimiento)

**Cliente, desde el portal**

- [Ver mis máquinas](#ver-mis-máquinas)
- [Ver el historial de una máquina](#ver-el-historial-de-una-máquina)
- [Solicitar un mantenimiento](#solicitar-un-mantenimiento)
- [Qué no se puede hacer desde el portal](#qué-no-se-puede-hacer-desde-el-portal)

---

## Los tres roles

| Rol | Entra a | En resumen |
|---|---|---|
| **Administrador** | Panel interno | Todo lo que hace un empleado, más gestionar cuentas, dar acceso al portal, archivar registros y eliminar mantenimientos. |
| **Empleado** | Panel interno | Consultar y registrar: clientes, sedes, máquinas, marcas, tipos y mantenimientos. No archiva, no gestiona cuentas. |
| **Cliente** | Portal | Ve su ficha, sus máquinas y el historial de cada una, y puede solicitar mantenimiento. No ve nada de otros clientes. |

El administrador y el empleado ven la misma barra de navegación, con una única
diferencia: **la pestaña «Usuarios» sólo aparece para el administrador**. Los
botones de archivar y eliminar tampoco se muestran a un empleado.

---

## Ingresar al sistema

Todas las personas entran por **la misma pantalla de inicio de sesión**, con correo
y contraseña. El sistema reconoce el rol y lleva a cada quien a donde corresponde:
el personal al panel interno, los clientes al portal.

Si alguien intenta abrir una dirección que no le corresponde —un cliente
escribiendo la dirección del panel interno, por ejemplo— el sistema lo devuelve a
su propia área.

**No existe registro por cuenta propia.** Todas las cuentas las crea un
administrador: las internas desde «Usuarios», las de cliente desde la ficha del
cliente.

## Salir

El botón **«Salir»**, arriba a la derecha, cierra la sesión y devuelve a la
pantalla de inicio de sesión. Está disponible tanto en el panel como en el portal.

---

# Cinco reglas que atraviesan todo el sistema

Conviene leerlas una vez antes de usar el sistema: explican comportamientos que de
otro modo sorprenden.

### 1. Nada se borra; los registros se archivan

Donde otros sistemas dicen «eliminar», este dice **«Archivar»**. El registro no
desaparece: queda marcado como inactivo, deja de aparecer en las listas y en los
selectores, y su información y su historial se conservan.

*Por qué:* archivar conserva el historial y evita romper las referencias de otros
registros, como los mantenimientos ligados a una máquina que ya no está en
servicio.

Hay dos excepciones, ambas exclusivas del administrador y ambas definitivas: las
[cuentas internas](#eliminar-una-cuenta-interna) y los
[mantenimientos](#eliminar-un-mantenimiento).

**No existe todavía una pantalla para desarchivar.** Reactivar un cliente, una sede
o una máquina requiere intervención técnica sobre la base de datos.

### 2. El impuesto vacío significa «no digitado», no «exento»

Dejar el campo de impuesto en blanco **no** declara que el servicio esté exento.
Significa que el monto todavía no se ha digitado: es un dato faltante, y alguien
debe volver a completarlo. **Un servicio realmente exento se registra con impuesto
`0`.**

*Por qué:* al leer los reportes, un mantenimiento con impuesto vacío es un registro
incompleto y uno con impuesto `0` es un registro terminado que afirma que no se
cobró impuesto. Si se tratara el vacío como exento, ambos casos serían
indistinguibles y no habría manera de saber cuáles faltan por completar.

El **total lo calcula el sistema** —subtotal más impuesto— y no se escribe a mano.
Si subtotal e impuesto están ambos vacíos, el total también queda vacío: es un
mantenimiento aún sin facturar.

### 3. La sede de un mantenimiento es una instantánea

El campo «Sede donde se atendió» se propone solo, a partir de la ubicación actual
de la máquina, y **queda editable**. Una vez guardado **no vuelve a cambiar por su
cuenta**: es la fotografía de dónde se realizó ese trabajo concreto.

*Por qué:* si la sede del mantenimiento siguiera a la máquina, prestar una máquina
a otra tienda reescribiría todo su historial, y el reporte del año pasado cambiaría
solo.

**Consecuencia de corregirla mal:** si alguien edita un mantenimiento antiguo y
cambia la sede porque «la máquina hoy está en otra tienda», ese trabajo queda
contabilizado en la tienda equivocada y **el reporte por tienda de ese período
cambia**. La sede sólo debe corregirse cuando se digitó mal en su momento, nunca
para ponerla al día.

### 4. Las sedes archivadas siguen apareciendo, marcadas

Si una máquina o un mantenimiento ya apuntaba a una sede que después se archivó,
esa sede **sigue apareciendo en su formulario**, identificada como *(archivada)*.
No aparece en los formularios que no la usaban.

*Por qué:* si desapareciera, editar cualquier otro campo del registro —una fecha,
una descripción— borraría la sede en silencio al guardar, y con ella una parte del
historial.

### 5. Las solicitudes de los clientes se atienden primero

Un mantenimiento con estado **«solicitado»** lo pidió un cliente desde el portal y
espera respuesta. El sistema los destaca por todos lados:

- Aparecen **de primero** en la lista de Mantenimientos, antes que cualquier otro
  registro.
- La pestaña «Mantenimientos» muestra un **contador de pendientes**.
- La página de inicio del panel los cuenta en una tarjeta destacada.

---

# Tareas del personal

Todo lo de esta sección lo puede hacer tanto un **empleado** como un
**administrador**.

## Registrar un mantenimiento

1. Abra la pestaña **«Mantenimientos»** y pulse **«Nuevo mantenimiento»**.
2. Complete el formulario. Sólo dos campos son obligatorios: **Máquina** y
   **Descripción**.

| Campo | Qué poner |
|---|---|
| **Máquina** | Obligatorio. Sólo se ofrecen máquinas activas. El cliente se deduce de ella, así que no se captura aparte. |
| **Sede donde se atendió** | Se propone sola desde la máquina. Puede cambiarla. Lea la [regla 3](#3-la-sede-de-un-mantenimiento-es-una-instantánea). |
| **Técnico responsable** | Opcional. Se elige de las cuentas internas, administradores y empleados. |
| **Fecha** | Opcional. Una solicitud todavía no la tiene. |
| **Estado** | Solicitado, programado, en proceso, completado o cancelado. Al crear se propone «programado». |
| **Horímetro** | La lectura tomada en la visita, en horas. |
| **Subtotal** | El monto antes de impuesto. |
| **Impuesto** | Se propone el 13 % del subtotal y es editable. Lea la [regla 2](#2-el-impuesto-vacío-significa-no-digitado-no-exento). |
| **Total** | Lo calcula el sistema. No se digita. |
| **N.º de boleta o reporte** | El número del documento de servicio. |
| **N.º de proforma** | El número de la proforma. |
| **Correctivo** | Casilla. Marcada, es correctivo; sin marcar, preventivo. |
| **Descripción** | Obligatorio. Qué se hizo o qué hay que hacer. |

3. Pulse **«Guardar»**.

En cuanto escriba el subtotal, el impuesto se rellena solo con el 13 %. **En cuanto
usted toque el campo de impuesto, deja de recalcularse**, para que un monto escrito
a mano no desaparezca al corregir el subtotal.

## Corregir un mantenimiento ya registrado

En la lista de **«Mantenimientos»**, pulse **«Editar»** en la fila
correspondiente. El formulario es el mismo del alta y todos los campos son
modificables, incluido el estado.

Al abrir la edición **gana el valor guardado**: la sede no se vuelve a proponer.
Sólo si usted cambia la máquina, el formulario ofrece una sede nueva.

Antes de tocar la sede de un mantenimiento antiguo, lea la
[regla 3](#3-la-sede-de-un-mantenimiento-es-una-instantánea).

## Atender una solicitud enviada por un cliente

Las solicitudes llegan con estado **«solicitado»**, sin fecha, sin técnico y sin
montos: el cliente sólo aporta la descripción de lo que necesita.

1. Localícela al principio de la lista de **«Mantenimientos»**.
2. Pulse **«Editar»**.
3. Para **agendarla**: ponga la fecha, asigne el técnico, revise la sede y cambie
   el estado a **«programado»**.
4. Para **rechazarla**: cambie el estado a **«cancelado»**.
5. Guarde. El contador de pendientes baja y el cliente ve el cambio en el historial
   de su máquina.

Los costos pueden completarse en ese momento o después, cuando exista la boleta.

## Registrar un cliente nuevo

1. Pestaña **«Clientes»** → **«Nuevo cliente»**.
2. Campos: **Nombre** (obligatorio), Correo, Teléfono y Dirección.
3. Guarde.

Crear el cliente **no le da acceso al portal**; eso es una
[tarea aparte del administrador](#dar-acceso-al-portal-a-un-cliente).

## Registrar una sede de un cliente

Las sedes son las tiendas o sucursales de un cliente.

1. Pestaña **«Sedes»** → **«Nueva sede»**.
2. Campos: **Cliente** (obligatorio), **Nombre** (obligatorio) y Dirección.
3. Guarde.

**El nombre sólo tiene que ser único dentro de cada cliente.** Dos clientes
distintos pueden tener cada uno una sede llamada «Centro»; el sistema no lo impide.
Lo que sí rechaza es repetir el nombre dentro del mismo cliente.

## Registrar una máquina

1. Pestaña **«Máquinas»** → **«Nueva máquina»**.
2. Complete el formulario:

| Campo | Qué poner |
|---|---|
| **Nombre** | Obligatorio. |
| **Número de serie** | Opcional, del fabricante. **Si se llena, no puede repetirse en otra máquina.** |
| **Número de activo** | Opcional. La placa de inventario del cliente. **Sí puede repetirse entre clientes distintos.** |
| **Modelo** | Opcional. |
| **Marca** | Obligatorio, de la lista. Debe existir antes. |
| **Tipo** | Obligatorio, de la lista. Debe existir antes. |
| **Cliente dueño** | Opcional. |
| **Sede actual** | Opcional. **Sólo se habilita después de elegir el cliente dueño**, y sólo ofrece las sedes de ese cliente. |

3. Guarde.

Si necesita una marca o un tipo que aún no existe, créelos primero: los selectores
sólo ofrecen los que ya están registrados y activos.

Deje el número de serie en blanco si la máquina no tiene uno. **No invente rellenos
del tipo «SIN-SERIE-1»**: el sistema admite tantas máquinas sin serie como haga
falta, y esos rellenos terminan siendo permanentes y saliendo en los reportes.

## Trasladar una máquina a otra tienda

Cuando una máquina se presta a otra sede del mismo cliente:

1. Pestaña **«Máquinas»** → **«Editar»** en la máquina.
2. Cambie **«Sede actual»** por la sede a la que se trasladó.
3. Guarde.

Esto cambia dónde está la máquina **hoy**. **No modifica ningún mantenimiento
anterior**: cada uno conserva la sede donde efectivamente se realizó el trabajo. Es
exactamente lo que se busca, y es la [regla 3](#3-la-sede-de-un-mantenimiento-es-una-instantánea).

## Registrar una marca o un tipo de maquinaria

Las pestañas **«Marcas»** y **«Tipos»** funcionan igual: **Nombre** (obligatorio) y
Descripción. El nombre no puede repetirse.

Son listas de apoyo: existen para que las máquinas puedan clasificarse, y hay que
crearlas antes de registrar una máquina que las use.

## Descargar el catálogo completo para Excel

1. Pestaña **«Reportes»**.
2. Pulse **«Descargar catálogo (CSV)»**.

Se descarga un archivo `catalogo-servicios-age.csv` que abre directamente en Excel,
dividido en seis secciones:

| Sección | Columnas |
|---|---|
| Clientes | Nombre, Correo, Teléfono |
| Sedes | Nombre, Cliente, Dirección |
| Máquinas | Nombre, Serie, N.º activo, Marca, Tipo, Cliente, Sede |
| Mantenimientos | Fecha, Máquina, Sede, Tipo, Estado, Técnico, Horímetro, Subtotal, Impuesto, Total, N.º boleta, N.º proforma, Descripción |
| Marcas | Nombre |
| Tipos de maquinaria | Nombre |

La columna «Sede» de la hoja de mantenimientos es **dónde se hizo cada trabajo**, y
puede no coincidir con la sede actual de la máquina que aparece en la hoja anterior.
El archivo contiene exactamente la información que la sesión de quien lo descarga
tiene permitido consultar.

---

# Tareas exclusivas del administrador

## Crear una cuenta para alguien de la empresa

1. Pestaña **«Usuarios»** → **«Nuevo usuario»**.
2. Complete: **Nombre completo**, **Correo**, **Contraseña temporal** (mínimo 6
   caracteres) y **Rol** (empleado o administrador).
3. Pulse **«Crear usuario»**.
4. Entregue el correo y la contraseña temporal a la persona.

## Cambiar el rol de una cuenta

En la lista de **«Usuarios»**, cada fila tiene un selector de rol. Elija el rol
nuevo y pulse **«Guardar»**.

**La pantalla «Usuarios» contiene únicamente cuentas internas.** Los accesos al
portal de los clientes **no aparecen ahí**: se consultan y se crean desde
[la ficha del cliente](#dar-acceso-al-portal-a-un-cliente), en «Clientes» →
«Editar» → «Acceso al portal». Ése es el único lugar donde se gestionan.

Dos cambios de rol están prohibidos y el sistema los rechaza con un mensaje:

- **Quitarle el rol al último administrador.** Si no quedara ninguno, nadie podría
  volver a gestionar cuentas.
- **Convertir un acceso de portal en una cuenta interna, o al revés.** Un acceso de
  portal está atado a la ficha de su cliente; volverlo personal interno le daría
  visibilidad sobre los datos de todos los clientes. La prohibición está impuesta
  en la base de datos, no sólo en la pantalla: no hay forma de conseguirlo por otra
  vía.

## Eliminar una cuenta interna

En la lista de **«Usuarios»**, pulse **«Eliminar»** en la fila y confirme el aviso.

**Esta acción es definitiva**: la cuenta se borra y no se puede deshacer. A
diferencia del resto del sistema, aquí no hay archivado.

El sistema impide dos casos: **eliminar la propia cuenta** con la que se está
trabajando, y **eliminar al último administrador**.

## Dar acceso al portal a un cliente

1. Pestaña **«Clientes»** → **«Editar»** en el cliente.
2. Baje hasta la sección **«Acceso al portal»**.
3. Complete el **correo de acceso** —viene propuesto el correo del cliente— y una
   **contraseña temporal** de al menos 6 caracteres.
4. Pulse **«Habilitar acceso al portal»**.
5. Entregue esas credenciales al cliente.

Si el cliente ya tiene acceso, en lugar del formulario se muestra su estado.

> **Un solo acceso por cliente.** Cada cliente puede tener como máximo **un** inicio
> de sesión de portal. Si se intenta crear un segundo —dos administradores
> habilitando el acceso a la vez, o un doble clic— la base de datos lo rechaza y
> aparece un mensaje de error. Esto es deliberado: con dos accesos, archivar al
> cliente dejaría uno de ellos activo.

## Archivar un cliente, es decir, darlo de baja

1. Pestaña **«Clientes»** → **«Archivar»** en la fila del cliente.

Archivar un cliente hace tres cosas a la vez:

- Lo **oculta de las listas** internas y de los selectores.
- **Inhabilita su acceso al portal**, si lo tenía: ese inicio de sesión queda
  bloqueado y la persona ya no puede entrar ni consultar sus datos.
- **Conserva sus máquinas y todo su historial de mantenimientos**, que dejan de
  mostrarse en el portal pero siguen en el sistema.

Es el procedimiento de baja de un cliente. No hay otro.

## Archivar una sede, una máquina, una marca o un tipo

En la lista correspondiente, pulse **«Archivar»** en la fila. El registro
desaparece de las listas y de los selectores, y conserva todo lo asociado.

Recuerde la [regla 4](#4-las-sedes-archivadas-siguen-apareciendo-marcadas): una
sede archivada seguirá apareciendo, marcada como *(archivada)*, en los formularios
de las máquinas y los mantenimientos que ya la referenciaban.

## Eliminar un mantenimiento

En la lista de **«Mantenimientos»**, la fila incluye un botón **«Eliminar»**
visible únicamente para el administrador.

> **Esta acción borra el registro de forma definitiva y no se puede deshacer.**
> A diferencia del resto del catálogo, el mantenimiento no se archiva: desaparece.
> No hay diálogo de confirmación previo.
>
> El registro de mantenimientos es lo que un cliente puede disputar y aquello contra
> lo que la empresa factura. Antes de eliminar, considere si lo correcto no es
> cambiar el estado a **«cancelado»**, que conserva la constancia de que el trabajo
> se pidió y no se hizo.

<!-- VERIFICAR: la documentación heredada del proyecto (README.md y las reglas internas) describe los mantenimientos como archivables y nunca eliminables. El código no implementa ese archivado: deleteMaintenance en src/app/dashboard/maintenances/actions.ts ejecuta un DELETE físico, la tabla no tiene columna active y la política maintenances_delete lo autoriza al rol admin. Se documenta el comportamiento observado, no el declarado. -->

---

# El portal del cliente

El cliente entra por la misma pantalla de inicio de sesión y llega a su portal, que
muestra sólo su propia información.

## Ver mis máquinas

La página de inicio del portal tiene dos partes:

- **Mi información**: nombre, correo, teléfono y dirección de la empresa.
- **Mis máquinas**: una tarjeta por máquina **activa**, con su número de serie, la
  marca, el tipo, el modelo y la **sede actual**.

## Ver el historial de una máquina

Pulse una máquina para abrirla. Arriba aparecen sus datos —marca, tipo, modelo,
número de serie, número de activo y sede actual—, y debajo el **historial de
mantenimientos** con estas columnas: Fecha, Sede, Tipo (correctivo o preventivo),
Estado y Descripción.

**La sede de cada línea es dónde se realizó ese trabajo concreto**, así que puede
no coincidir con la sede actual de la máquina que aparece en el encabezado. Es
correcto: la máquina pudo trasladarse después.

El historial **no muestra montos**.

## Solicitar un mantenimiento

1. Abra la máquina para la que necesita servicio.
2. En el recuadro **«Solicitar mantenimiento»**, escriba en **«¿Qué necesita?»** lo
   que hace falta.
3. Pulse **«Enviar solicitud»**.

La solicitud aparece de inmediato en el historial de esa máquina, con estado
**«solicitado»**, y le llega destacada al personal de Servicios AGE. La sede queda
registrada automáticamente a partir de la ubicación actual de la máquina.

Cuando el personal la atienda, verá cambiar el estado a «programado» —con su
fecha— o a «cancelado».

## Qué no se puede hacer desde el portal

Conviene tenerlo claro; para cualquiera de estas cosas hay que contactar a
Servicios AGE:

- **No se pueden ver datos de otros clientes.** Ni por error ni escribiendo
  direcciones a mano: la restricción está en la base de datos, no en la pantalla.
- **No se puede editar la propia ficha** —nombre, correo, teléfono, dirección—. La
  mantiene el personal.
- **No se pueden crear ni editar sedes.** El portal no tiene pantalla de sedes; las
  administra el personal.
- **No se pueden registrar ni editar máquinas.**
- **No se puede editar ni cancelar una solicitud ya enviada.** Sólo se puede seguir
  su avance en el historial.
- **No se pueden fijar fechas, técnicos ni montos.** Al enviar una solicitud, la
  base de datos exige que esos campos vayan vacíos; los completa el personal.
- **No se ven las máquinas archivadas.**

---

# Cómo se protegen los datos

Resumen para quien tenga que responder por el sistema.

- **Los permisos se aplican en tres capas**, no en la pantalla. La última y decisiva
  es la propia base de datos: aunque alguien intente saltarse la interfaz y
  consultar directamente, la base sólo devuelve lo que a esa sesión le corresponde.
  Un cliente no puede leer ni modificar datos de otro cliente.
- **Sólo los administradores** archivan registros, gestionan cuentas y habilitan
  accesos al portal.
- **Un cliente tiene a lo sumo un acceso al portal**, garantizado por la base de
  datos. Es lo que asegura que archivar al cliente lo dé de baja de verdad.
- **Al solicitar un mantenimiento**, la base de datos exige que el cliente no fije
  subtotal, impuesto, horímetro ni números de boleta o proforma, y obliga a que la
  máquina sea suya y esté activa. Un cliente no puede escribir su propio costo ni
  siquiera evitando la pantalla.
- **La sede de una solicitud la determina el servidor** a partir de la máquina, no
  el formulario: el cliente no elige dónde queda registrado el trabajo.
- **Las contraseñas y las llaves nunca se guardan en el código**; viven en la
  configuración del servidor.
