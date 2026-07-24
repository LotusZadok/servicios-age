-- New statuses: 'solicitado' (created by a client) and 'cancelado' (closed unfulfilled).
alter table public.maintenances drop constraint maintenances_status_check;
alter table public.maintenances add constraint maintenances_status_check
  check (status in ('solicitado', 'programado', 'en_proceso', 'completado', 'cancelado'));

-- A request has no scheduled date yet; created_at records when it was asked.
alter table public.maintenances alter column date drop not null;

-- Client-only INSERT: a client may create a request on one of ITS OWN active
-- machines, always as 'solicitado', and never with date/technician/cost. This
-- policy is OR-combined with the existing staff insert policy.
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
