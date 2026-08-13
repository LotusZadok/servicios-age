-- Fase 4: sedes (locations), inventario del cliente y desglose de costos.
--
-- La base está vacía, así que los cambios destructivos (drop de `cost`) no
-- reconcilian datos. Hacerlos ahora evita una migración de datos después.

-- ─────────────────────────────────────────────────────────────────────────
-- locations: sedes o tiendas de un cliente
-- ─────────────────────────────────────────────────────────────────────────
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  name text not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  -- El nombre sólo tiene que ser único dentro del cliente: dos clientes
  -- distintos pueden tener ambos una sede "Centro".
  unique (client_id, name)
);

alter table public.locations enable row level security;

-- Staff lee y escribe todo; un cliente sólo lee sus propias sedes. No hay
-- política de escritura para clientes: las sedes las administra el staff.
create policy "locations_select" on public.locations for select to authenticated
  using (public.is_staff() or client_id = public.current_client_id());
create policy "locations_insert" on public.locations for insert to authenticated
  with check (public.is_staff());
create policy "locations_update" on public.locations for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "locations_delete" on public.locations for delete to authenticated
  using (public.is_admin());

-- Mismo patrón de privilegios que el resto del esquema (ver
-- 20260723000002_tighten_grants.sql). Los `alter default privileges` de esa
-- migración ya cubrirían esta tabla, pero explicitarlo deja el contrato a la
-- vista y no depende de que el rol creador siga siendo el mismo.
revoke all on public.locations from anon;
grant select, insert, update, delete on public.locations to authenticated;
grant all on public.locations to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- machines
-- ─────────────────────────────────────────────────────────────────────────

-- Ubicación ACTUAL de la máquina. Es mutable a propósito: las máquinas se
-- prestan entre tiendas del mismo cliente.
alter table public.machines add column location_id uuid references public.locations(id);

-- Placa de inventario del cliente. Distinta del número de serie del
-- fabricante, y sin unicidad: la numeración la lleva cada cliente y puede
-- repetirse entre clientes.
alter table public.machines add column asset_number text;

-- serial_number ya era nullable desde el esquema inicial; lo que faltaba era
-- la unicidad. Índice parcial en vez de constraint: así dos máquinas sin
-- número de serie no chocan entre sí y no hacen falta valores de relleno
-- tipo 'SIN-SERIE-1', que ensucian los reportes y se vuelven permanentes.
create unique index machines_serial_number_unique
  on public.machines (serial_number)
  where serial_number is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- maintenances
-- ─────────────────────────────────────────────────────────────────────────

-- La política de inserción de clientes nombra la columna `cost`, así que hay
-- que soltarla antes de borrar la columna. Se recrea más abajo, ampliada.
drop policy "maintenances_insert_client" on public.maintenances;

alter table public.maintenances drop column cost;

-- Guardamos el MONTO del impuesto, no la tasa: si el IVA cambia, los
-- registros viejos siguen cuadrando con la boleta que se emitió ese día.
alter table public.maintenances add column cost_subtotal numeric(12, 2);
alter table public.maintenances add column tax_amount numeric(12, 2);
alter table public.maintenances add column cost_total numeric(12, 2)
  generated always as (
    -- Un subtotal sin impuesto sigue teniendo total. Sólo cuando ambos están
    -- vacíos (un mantenimiento aún sin facturar) el total es NULL.
    case
      when cost_subtotal is null and tax_amount is null then null
      else coalesce(cost_subtotal, 0) + coalesce(tax_amount, 0)
    end
  ) stored;

-- INSTANTÁNEA de dónde estaba la máquina cuando se hizo el trabajo, no una
-- referencia viva. Si después la máquina se presta a otra tienda, este valor
-- NO se actualiza: el historial debe seguir diciendo dónde se atendió.
alter table public.maintenances add column location_id uuid references public.locations(id);

-- Lectura del horímetro en la visita.
alter table public.maintenances add column hour_meter integer;

-- Número de boleta o reporte de servicio, y número de proforma.
alter table public.maintenances add column report_ref text;
alter table public.maintenances add column quote_ref text;

-- Igual que antes: un cliente puede abrir una solicitud sobre una máquina
-- propia y activa, siempre como 'solicitado' y sin nada que le corresponda
-- llenar al staff. La lista de columnas prohibidas crece con el esquema —
-- sin `cost_subtotal is null` un cliente podría insertar su propio costo.
-- location_id queda fuera a propósito: es la sede de la máquina y se
-- prellena desde el servidor al crear la solicitud.
create policy "maintenances_insert_client" on public.maintenances for insert to authenticated
  with check (
    machine_id in (
      select id from public.machines
      where client_id = public.current_client_id() and active
    )
    and status = 'solicitado'
    and date is null
    and technician_id is null
    and cost_subtotal is null
    and tax_amount is null
    and hour_meter is null
    and report_ref is null
    and quote_ref is null
  );
