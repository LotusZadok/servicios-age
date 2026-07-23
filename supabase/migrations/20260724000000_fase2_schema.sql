-- Recovered fields from the original system + soft-delete flags.
alter table public.brands add column description text;
alter table public.brands add column active boolean not null default true;

alter table public.machine_types add column description text;
alter table public.machine_types add column active boolean not null default true;

alter table public.clients add column address text;
alter table public.clients add column active boolean not null default true;

alter table public.machines add column model text;
alter table public.machines add column client_id uuid references public.clients(id);
alter table public.machines add column active boolean not null default true;

-- Link a `cliente` profile to its client record.
alter table public.profiles add column client_id uuid references public.clients(id);

-- Extend the role check to include 'cliente'.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'empleado', 'cliente'));

-- Maintenance registry (existed in the original schema, never built).
create table public.maintenances (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id),
  technician_id uuid references public.profiles(id),
  date date not null,
  description text not null,
  is_corrective boolean not null default false,
  cost numeric(12, 2),
  status text not null default 'programado'
    check (status in ('programado', 'en_proceso', 'completado')),
  created_at timestamptz not null default now()
);

alter table public.maintenances enable row level security;
