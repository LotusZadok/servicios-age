create extension if not exists "pgcrypto";

-- profiles: extends auth.users with role info
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'empleado')),
  created_at timestamptz not null default now()
);

-- security-definer helper avoids recursive RLS lookups on profiles
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_admin_only"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No insert policy: profile rows are only ever created server-side via the
-- service-role client (see src/lib/supabase/admin.ts), never by a client session.

-- brands
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.brands enable row level security;

create policy "brands_select_authenticated"
  on public.brands for select to authenticated using (true);
create policy "brands_insert_authenticated"
  on public.brands for insert to authenticated with check (true);
create policy "brands_update_authenticated"
  on public.brands for update to authenticated using (true) with check (true);
create policy "brands_delete_admin_only"
  on public.brands for delete to authenticated using (public.is_admin());

-- machine_types
create table public.machine_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.machine_types enable row level security;

create policy "machine_types_select_authenticated"
  on public.machine_types for select to authenticated using (true);
create policy "machine_types_insert_authenticated"
  on public.machine_types for insert to authenticated with check (true);
create policy "machine_types_update_authenticated"
  on public.machine_types for update to authenticated using (true) with check (true);
create policy "machine_types_delete_admin_only"
  on public.machine_types for delete to authenticated using (public.is_admin());

-- clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients_select_authenticated"
  on public.clients for select to authenticated using (true);
create policy "clients_insert_authenticated"
  on public.clients for insert to authenticated with check (true);
create policy "clients_update_authenticated"
  on public.clients for update to authenticated using (true) with check (true);
create policy "clients_delete_admin_only"
  on public.clients for delete to authenticated using (public.is_admin());

-- machines
create table public.machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  serial_number text,
  brand_id uuid not null references public.brands(id),
  type_id uuid not null references public.machine_types(id),
  created_at timestamptz not null default now()
);

alter table public.machines enable row level security;

create policy "machines_select_authenticated"
  on public.machines for select to authenticated using (true);
create policy "machines_insert_authenticated"
  on public.machines for insert to authenticated with check (true);
create policy "machines_update_authenticated"
  on public.machines for update to authenticated using (true) with check (true);
create policy "machines_delete_admin_only"
  on public.machines for delete to authenticated using (public.is_admin());
