-- Helpers (security definer, mirror the existing is_admin()).
create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'empleado')
  );
$$;

create or replace function public.current_client_id()
returns uuid language sql security definer set search_path = public stable as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- profiles: staff see all; a client sees only its own row.
drop policy "profiles_select_authenticated" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (public.is_staff() or id = auth.uid());

-- clients: staff see all; a client sees only its own record. Writes: staff only.
drop policy "clients_select_authenticated" on public.clients;
create policy "clients_select" on public.clients for select to authenticated
  using (public.is_staff() or id = public.current_client_id());
drop policy "clients_insert_authenticated" on public.clients;
create policy "clients_insert" on public.clients for insert to authenticated
  with check (public.is_staff());
drop policy "clients_update_authenticated" on public.clients;
create policy "clients_update" on public.clients for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- machines: staff see all; a client sees only machines it owns. Writes: staff only.
drop policy "machines_select_authenticated" on public.machines;
create policy "machines_select" on public.machines for select to authenticated
  using (public.is_staff() or client_id = public.current_client_id());
drop policy "machines_insert_authenticated" on public.machines;
create policy "machines_insert" on public.machines for insert to authenticated
  with check (public.is_staff());
drop policy "machines_update_authenticated" on public.machines;
create policy "machines_update" on public.machines for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- brands / machine_types: select stays open (labels only); writes staff only.
drop policy "brands_insert_authenticated" on public.brands;
create policy "brands_insert" on public.brands for insert to authenticated
  with check (public.is_staff());
drop policy "brands_update_authenticated" on public.brands;
create policy "brands_update" on public.brands for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy "machine_types_insert_authenticated" on public.machine_types;
create policy "machine_types_insert" on public.machine_types for insert to authenticated
  with check (public.is_staff());
drop policy "machine_types_update_authenticated" on public.machine_types;
create policy "machine_types_update" on public.machine_types for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- maintenances: staff see all; a client sees only maintenances of machines it owns.
create policy "maintenances_select" on public.maintenances for select to authenticated
  using (
    public.is_staff()
    or machine_id in (
      select id from public.machines where client_id = public.current_client_id()
    )
  );
create policy "maintenances_insert" on public.maintenances for insert to authenticated
  with check (public.is_staff());
create policy "maintenances_update" on public.maintenances for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "maintenances_delete" on public.maintenances for delete to authenticated
  using (public.is_admin());
