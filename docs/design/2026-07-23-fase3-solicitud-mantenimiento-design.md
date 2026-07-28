# Fase 3: Solicitud de mantenimiento por el cliente (AGServicios)

Documento de diseño escrito el 23 de julio de 2026, antes de implementar.
Describe el alcance decidido en ese momento —que el cliente pueda
solicitar un mantenimiento— y se conserva sin editar como registro de esa
decisión; lo descrito aquí se implementó tal como está escrito, y lo
único agregado después es el rebranding de la marca a Servicios AGE
(27 de julio de 2026), que no toca nada de esta fase.

## Contexto

La Fase 2 (desplegada) añadió el portal de clientes de **solo lectura**: un cliente
ve su ficha, sus máquinas y el historial de mantenimientos de cada una, con RLS que
lo aísla a sus propios datos. Los mantenimientos son una única tabla (`maintenances`)
gestionada internamente por staff (admin/empleado), con estados `programado`,
`en_proceso`, `completado`.

La Fase 3 abre la **primera capacidad de escritura del cliente**: solicitar un
mantenimiento para una de sus máquinas. Es la idea que quedó anotada como candidata a
Fase 3 al cerrar la Fase 2.

Spec de Fase 2: `docs/design/2026-07-23-fase2-portal-clientes-mantenimientos-design.md`

## Objetivo

- El cliente puede **solicitar** un mantenimiento para una de sus máquinas activas
  (solo descripción; sin fecha/técnico/costo).
- El staff ve las solicitudes entrantes, las **agenda** (las convierte en un
  mantenimiento programado) o las **cancela**.
- Un **indicador** en la app avisa al staff de cuántas solicitudes están pendientes.

## Decisiones tomadas (cerradas en el brainstorming)

- **Alcance:** solo "solicitar mantenimiento". Editar la propia ficha del cliente
  queda fuera.
- **Modelo:** se reutiliza la tabla `maintenances` con un estado nuevo `solicitado`
  (no una tabla aparte). Una solicitud *es* el futuro mantenimiento; al agendarla, el
  mismo registro pasa a `programado`.
- **Cierre:** nuevo estado `cancelado` para solicitudes que no se realizarán
  (lo cierra admin o empleado); no se borra, se conserva el histórico.
- **Cliente:** solo puede **crear** solicitudes. No puede editarlas ni cancelarlas ni
  borrarlas.
- **Aviso:** indicador dentro de la app (contador de pendientes en la navegación +
  solicitudes destacadas primero en la lista). Sin correo.

## Fuera de alcance

- Que el cliente edite su ficha o cancele/edite solicitudes.
- Notificaciones por correo o push.
- Adjuntos en la solicitud.

## Modelo de datos

Una migración nueva (`supabase/migrations/`), aplicada local y a la nube vía
`supabase db push`.

### Cambios sobre `maintenances`

```sql
-- Nuevos estados: solicitado (creado por el cliente) y cancelado (cerrado sin hacer).
alter table public.maintenances drop constraint maintenances_status_check;
alter table public.maintenances add constraint maintenances_status_check
  check (status in ('solicitado', 'programado', 'en_proceso', 'completado', 'cancelado'));

-- Una solicitud aún no tiene fecha agendada; el "cuándo se pidió" ya lo da created_at.
alter table public.maintenances alter column date drop not null;
```

> Nota: el nombre `maintenances_status_check` es el auto-generado por el check inline
> de la Fase 2. Si `db reset` reporta otro nombre, se ajusta la línea del `drop`.

### Nueva política RLS: inserción por el cliente

Se añade una política de INSERT para clientes, en paralelo a la de staff (las
políticas permisivas se combinan con OR):

```sql
create policy "maintenances_insert_client" on public.maintenances for insert to authenticated
  with check (
    machine_id in (
      select id from public.machines
      where client_id = public.current_client_id() and active
    )
    and status = 'solicitado'
    and date is null
    and technician_id is null
    and cost is null
  );
```

Esto fija la forma exacta de una fila creada por un cliente: solo sobre una máquina
**suya y activa**, en estado `solicitado`, y **sin** fecha, técnico ni costo. No puede
crear un mantenimiento ya "completado" ni asignarse costo/técnico.

No se añaden políticas de UPDATE ni DELETE para clientes: una vez creada, el cliente
**no puede modificar ni borrar** su solicitud. Su superficie de escritura total es esa
única política de inserción. (Las políticas de staff de la Fase 2 —select/insert/
update todo para staff, delete admin— permanecen sin cambios.)

## Portal del cliente (lado que solicita)

### Solicitar
- En **`/portal/machines/[id]`** (detalle de su máquina) se añade un formulario
  **"Solicitar mantenimiento"**: un campo **descripción** + botón enviar. La máquina
  ya está en contexto; el cliente no elige máquina.
- Server action del portal (`requestMaintenance`), protegido con `requireClient()`,
  que inserta `{ machine_id, description, status: 'solicitado' }`. RLS es la segunda
  barrera. Tras enviar, `revalidatePath` de la página de la máquina.
- Defensa en profundidad: la acción verifica que la máquina pertenezca al cliente
  actual antes de insertar (además de la política RLS).

### Ver el avance
- El **historial de mantenimientos** de esa máquina (ya existente en Fase 2) lista
  todos los registros con su estado, así que la solicitud aparece ahí como
  `solicitado` y el cliente ve cómo avanza (`programado`, `completado`…) sin una
  pantalla nueva.

## Lado del staff (gestión)

### Bandeja de solicitudes
- En **`/dashboard/maintenances`**, el orden pasa a **solicitudes primero**, luego el
  resto por fecha descendente. Concretamente: ordenar por un criterio que ponga
  `status = 'solicitado'` arriba, después por `date`/`created_at` desc. Las
  solicitudes se muestran visualmente destacadas (p. ej. una etiqueta "Solicitado").

### Indicador en la navegación
- El layout del dashboard calcula un `count` liviano de `maintenances` con
  `status='solicitado'` y lo muestra junto a "Mantenimientos" (ej. `Mantenimientos
  (3)`). Si es 0, no se muestra número.

### Gestionar
- El **editor de mantenimiento existente** sirve para agendar: el staff cambia el
  estado a `programado` y completa fecha, técnico y costo. El selector de estado
  del formulario se amplía con `solicitado` y `cancelado`.
- **Cancelar** = cambiar estado a `cancelado` (admin o empleado).
- El editor debe permitir **fecha vacía** (las solicitudes llegan sin fecha); al
  agendar, el staff la completa. Esto implica que el campo fecha del formulario deja
  de ser `required` y la acción de update acepta fecha nula.

## Permisos (resumen)

| Acción | Quién |
|---|---|
| Crear solicitud (`solicitado`, sin fecha/técnico/costo, máquina propia) | cliente |
| Ver sus solicitudes/mantenimientos | cliente (solo los de sus máquinas) |
| Agendar / editar / cambiar estado (incl. cancelar) | admin, empleado |
| Eliminar mantenimiento | admin |
| Editar o borrar una solicitud como cliente | nadie (no permitido) |

## Testing

- **Unit (Vitest):** una función pura de ordenamiento/priorización de la lista
  (solicitudes primero) o el helper del contador de pendientes.
- **E2E (Playwright):**
  - Un cliente abre su máquina, **solicita** un mantenimiento, y lo ve como
    `solicitado` en el historial de esa máquina.
  - El staff ve el **contador** de pendientes en la nav y **agenda** la solicitud
    (estado `programado` + fecha); el contador de pendientes baja.
- Estilo Fase 1/2: camino feliz + separación de permisos por rol, no cobertura
  exhaustiva.

## Despliegue

- Migración nueva aplicada a la nube con `supabase db push`; código auto-desplegado en
  Vercel al hacer push a GitHub.
- Sin cambios de infraestructura.
- Actualizar `docs/manual-usuario.md` con el flujo de solicitud (cliente) y de
  gestión/estados (staff).

## Secuencia de implementación (para el plan)

1. **Esquema + RLS:** migración (estados nuevos, `date` nullable, política de
   inserción del cliente); regenerar tipos.
2. **Portal:** formulario + acción `requestMaintenance` en el detalle de máquina.
3. **Staff:** ordenar solicitudes primero, badge de estado, contador en la nav,
   estados nuevos en el editor, fecha opcional.
4. **Tests + manual + deploy.**

Cada capa deja la app funcional.
