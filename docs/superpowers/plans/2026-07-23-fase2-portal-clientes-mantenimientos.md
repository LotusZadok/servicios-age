# Fase 2: Portal de clientes + mantenimientos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing original fields + soft-delete, machine ownership by client, a maintenance registry, a role-aware permission model, and a read-only client portal (`/portal`) with a new `cliente` role, on top of the deployed Fase 1 app.

**Architecture:** One migration adds columns/soft-delete flags/`maintenances`/the `cliente` role; a second migration installs role-aware RLS (`is_staff()`, `current_client_id()`). App code gains role helpers, staff/client route guards, role-based routing, maintenance CRUD, client-access provisioning, and portal pages. RLS is the primary data gate; portal queries also filter explicitly (defense in depth).

**Tech Stack:** Next.js 16 (App Router, TS), Tailwind v4, @supabase/ssr + supabase-js, Supabase CLI (local Postgres via Docker), Vitest, Playwright.

Spec: `docs/superpowers/specs/2026-07-23-fase2-portal-clientes-mantenimientos-design.md`

**Prerequisites:** Docker Desktop running + local Supabase up (`npx supabase start`). On this machine, prefix supabase CLI commands with the Docker bin on PATH:
`$env:PATH = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;$env:PATH"` (PowerShell).

---

## File Structure

```
src/
├── proxy.ts                                  # MODIFY: route by auth; /login -> '/'
├── lib/
│   ├── permissions.ts                        # MODIFY: Role += 'cliente'; isStaff/isClient/homePathForRole
│   └── auth.ts                               # MODIFY: requireStaff / requireClient guards
├── app/
│   ├── page.tsx                              # MODIFY: redirect by role
│   ├── login/actions.ts                      # MODIFY: redirect('/') after login
│   ├── dashboard/
│   │   ├── layout.tsx                        # MODIFY: requireStaff + Mantenimientos nav link
│   │   ├── brands/{actions.ts,page.tsx,new,[id]/edit}      # MODIFY: description + soft-delete
│   │   ├── machine-types/{...}               # MODIFY: description + soft-delete
│   │   ├── clients/{actions.ts,page.tsx,new,[id]/edit}     # MODIFY: address + soft-delete + portal access
│   │   ├── machines/{...}                     # MODIFY: model + client owner + soft-delete
│   │   └── maintenances/{actions.ts,page.tsx,new,[id]/edit}# CREATE: maintenance CRUD
│   └── portal/
│       ├── layout.tsx                        # CREATE: requireClient + portal header
│       ├── page.tsx                          # CREATE: client profile + their machines
│       └── machines/[id]/page.tsx            # CREATE: machine + maintenance history
├── supabase/migrations/
│   ├── 20260724000000_fase2_schema.sql       # CREATE
│   └── 20260724000001_fase2_rls.sql          # CREATE
└── tests/
    ├── unit/permissions.test.ts              # MODIFY: isStaff/isClient/homePathForRole
    └── e2e/{portal.spec.ts,maintenances.spec.ts}   # CREATE
```

---

## Task 1: Schema migration (fields, soft-delete, ownership, maintenances, cliente role)

**Files:**
- Create: `supabase/migrations/20260724000000_fase2_schema.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260724000000_fase2_schema.sql`:

```sql
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
```

> Note: the `profiles_role_check` name is the Postgres default for the inline
> `check` on `role` created in the Fase 1 migration. If `supabase db reset` reports
> the constraint name differs, run `\d public.profiles` in `npx supabase db shell`
> to find it and adjust the `drop constraint` line.

- [ ] **Step 2: Apply locally and verify it applies clean**

Run (PowerShell, Docker bin on PATH):
```
npx supabase migration up
```
Expected: `Applying migration 20260724000000_fase2_schema.sql...` then `Migrations applied` with no error.

- [ ] **Step 3: Verify the schema**

Run: `npx supabase db shell` then:
```
\d public.maintenances
```
Expected: table exists with columns machine_id, technician_id, date, description, is_corrective, cost, status, created_at. Then `\q`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260724000000_fase2_schema.sql
git commit -m "feat(db): fase 2 schema - fields, soft-delete, ownership, maintenances, cliente role"
```

---

## Task 2: Role-aware RLS migration + regenerate types

**Files:**
- Create: `supabase/migrations/20260724000001_fase2_rls.sql`
- Modify: `src/lib/database.types.ts` (regenerated)

- [ ] **Step 1: Write the RLS migration**

Create `supabase/migrations/20260724000001_fase2_rls.sql`:

```sql
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
```

- [ ] **Step 2: Apply locally**

Run: `npx supabase migration up`
Expected: `Applying migration 20260724000001_fase2_rls.sql...` then `Migrations applied`.

- [ ] **Step 3: Regenerate TypeScript types**

Run (PowerShell): `npx supabase gen types typescript --local | Out-File -Encoding utf8 src/lib/database.types.ts`
Then strip the BOM (Bash): `sed -i '1s/^\xEF\xBB\xBF//' src/lib/database.types.ts`
Expected: `src/lib/database.types.ts` now contains a `maintenances` table and the new columns (`active`, `client_id`, `model`, `address`, `description`).

- [ ] **Step 4: Confirm types compile**

Run: `npx tsc --noEmit`
Expected: PASS (no output). If existing inserts now require `active`, they don't — `active` has a default and is optional in the generated `Insert` type.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260724000001_fase2_rls.sql src/lib/database.types.ts
git commit -m "feat(db): role-aware RLS for staff/cliente + regenerate types"
```

---

## Task 3: Permissions module (Role + helpers) via TDD, and auth guards

**Files:**
- Modify: `src/lib/permissions.ts`
- Test: `tests/unit/permissions.test.ts`
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Write the failing tests**

Replace `tests/unit/permissions.test.ts` with:

```typescript
import { describe, expect, it } from 'vitest'
import {
  canDelete,
  canManageUsers,
  isStaff,
  isClient,
  homePathForRole,
} from '@/lib/permissions'

describe('canDelete', () => {
  it('allows admin', () => expect(canDelete('admin')).toBe(true))
  it('denies empleado', () => expect(canDelete('empleado')).toBe(false))
  it('denies cliente', () => expect(canDelete('cliente')).toBe(false))
})

describe('canManageUsers', () => {
  it('allows admin', () => expect(canManageUsers('admin')).toBe(true))
  it('denies empleado', () => expect(canManageUsers('empleado')).toBe(false))
  it('denies cliente', () => expect(canManageUsers('cliente')).toBe(false))
})

describe('isStaff', () => {
  it('admin is staff', () => expect(isStaff('admin')).toBe(true))
  it('empleado is staff', () => expect(isStaff('empleado')).toBe(true))
  it('cliente is not staff', () => expect(isStaff('cliente')).toBe(false))
})

describe('isClient', () => {
  it('cliente is client', () => expect(isClient('cliente')).toBe(true))
  it('admin is not client', () => expect(isClient('admin')).toBe(false))
})

describe('homePathForRole', () => {
  it('sends clients to /portal', () => expect(homePathForRole('cliente')).toBe('/portal'))
  it('sends admin to /dashboard', () => expect(homePathForRole('admin')).toBe('/dashboard'))
  it('sends empleado to /dashboard', () => expect(homePathForRole('empleado')).toBe('/dashboard'))
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test:unit`
Expected: FAIL — `isStaff`, `isClient`, `homePathForRole` not exported.

- [ ] **Step 3: Update permissions.ts**

Replace `src/lib/permissions.ts` with:

```typescript
export type Role = 'admin' | 'empleado' | 'cliente'

export function canDelete(role: Role): boolean {
  return role === 'admin'
}

export function canManageUsers(role: Role): boolean {
  return role === 'admin'
}

export function isStaff(role: Role): boolean {
  return role === 'admin' || role === 'empleado'
}

export function isClient(role: Role): boolean {
  return role === 'cliente'
}

export function homePathForRole(role: Role): string {
  return role === 'cliente' ? '/portal' : '/dashboard'
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm run test:unit`
Expected: PASS (all permissions tests green).

- [ ] **Step 5: Add staff/client guards to auth.ts**

In `src/lib/auth.ts`, add an import and two functions. Change the import line:

```typescript
import type { Role } from '@/lib/permissions'
```
to:
```typescript
import { isStaff, type Role } from '@/lib/permissions'
```

Then append after `requireAdmin`:

```typescript
export async function requireStaff() {
  const { user, profile } = await requireUser()

  if (!isStaff(profile.role)) {
    redirect('/portal')
  }

  return { user, profile }
}

export async function requireClient() {
  const { user, profile } = await requireUser()

  if (profile.role !== 'cliente') {
    redirect('/dashboard')
  }

  return { user, profile }
}
```

- [ ] **Step 6: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/permissions.ts tests/unit/permissions.test.ts src/lib/auth.ts
git commit -m "feat: add cliente role helpers and staff/client auth guards"
```

---

## Task 4: Role-based routing

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/login/actions.ts`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Route authenticated `/login` visitors through `/`**

In `src/proxy.ts`, change the protected-route check and the auth-route redirect. Replace:

```typescript
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
```

with:

```typescript
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/portal')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    // Root ('/') resolves the role and forwards to /dashboard or /portal.
    return NextResponse.redirect(new URL('/', request.url))
  }
```

- [ ] **Step 2: Make `/` redirect by role**

Replace `src/app/page.tsx` with:

```tsx
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { homePathForRole } from '@/lib/permissions'

export default async function Home() {
  const { profile } = await requireUser()
  redirect(homePathForRole(profile.role))
}
```

- [ ] **Step 3: Login redirects to `/`**

In `src/app/login/actions.ts`, change the success redirect from `redirect('/dashboard')` to:

```typescript
  redirect('/')
```

- [ ] **Step 4: Dashboard requires staff + add Mantenimientos link**

In `src/app/dashboard/layout.tsx`, change the import `import { requireUser } from '@/lib/auth'` to `import { requireStaff } from '@/lib/auth'`, and change `const { profile } = await requireUser()` to `const { profile } = await requireStaff()`.

Then add a Mantenimientos nav link after the Máquinas link:

```tsx
            <NavLink href="/dashboard/machines">Máquinas</NavLink>
            <NavLink href="/dashboard/maintenances">Mantenimientos</NavLink>
```

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/proxy.ts src/app/page.tsx src/app/login/actions.ts src/app/dashboard/layout.tsx
git commit -m "feat: role-based routing (cliente -> /portal, staff -> /dashboard)"
```

---

## Task 5: Brands & Machine-types — description field + soft-delete

**Files:**
- Modify: `src/app/dashboard/brands/{actions.ts,page.tsx,new/page.tsx,[id]/edit/page.tsx}`
- Modify: `src/app/dashboard/machine-types/{actions.ts,page.tsx,new/page.tsx,[id]/edit/page.tsx}`

- [ ] **Step 1: Brands — soft-delete + description in actions**

In `src/app/dashboard/brands/actions.ts`:

Change `createBrand` insert line:
```typescript
  const { error } = await supabase.from('brands').insert({ name })
```
to read description and insert it:
```typescript
  const description = (formData.get('description') as string) || null
  const { error } = await supabase.from('brands').insert({ name, description })
```
(place the `const description` line right after the existing `const name` line).

Change `updateBrand` similarly:
```typescript
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null

  const { error } = await supabase.from('brands').update({ name, description }).eq('id', id)
```

Change `deleteBrand` to soft-delete:
```typescript
  const supabase = await createClient()
  await supabase.from('brands').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/brands')
```

- [ ] **Step 2: Brands — list filters active + shows description; button says Archivar**

In `src/app/dashboard/brands/page.tsx`:

Change the query:
```typescript
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('active', true)
    .order('name')
```

Add a Descripción header after the Nombre header:
```tsx
            <th className="p-2">Nombre</th>
            <th className="p-2">Descripción</th>
```
Add a description cell after the name cell:
```tsx
              <td className="p-2">{brand.name}</td>
              <td className="p-2">{brand.description}</td>
```
Change the delete button label:
```tsx
                    <button type="submit" className="link-danger">
                      Archivar
                    </button>
```

- [ ] **Step 3: Brands — description input on new & edit**

In `src/app/dashboard/brands/new/page.tsx`, after the name `<div>` block, add:
```tsx
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Descripción
        </label>
        <input id="description" name="description" className="mt-1 w-full rounded border px-3 py-2" />
      </div>
```

In `src/app/dashboard/brands/[id]/edit/page.tsx`, after the name `<div>` block, add:
```tsx
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Descripción
        </label>
        <input
          id="description"
          name="description"
          defaultValue={brand.description ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
```

- [ ] **Step 4: Machine-types — repeat the same four edits**

Apply the identical changes to `src/app/dashboard/machine-types/` files, using the `machine_types` table, the `types` variable name already used in that list page, and route `/dashboard/machine-types`:
- `actions.ts`: add `description` to `createMachineType`/`updateMachineType`; change `deleteMachineType` to `.update({ active: false })`.
- `page.tsx`: `.eq('active', true)`; add Descripción header + `{type.description}` cell; button label `Archivar`.
- `new/page.tsx` and `[id]/edit/page.tsx`: add the same Descripción input (`defaultValue={type.description ?? ''}` on edit).

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/brands src/app/dashboard/machine-types
git commit -m "feat: description field and soft-delete for brands and machine types"
```

---

## Task 6: Clients — address field + soft-delete

**Files:**
- Modify: `src/app/dashboard/clients/{actions.ts,page.tsx,new/page.tsx,[id]/edit/page.tsx}`

- [ ] **Step 1: Actions — address + soft-delete**

In `src/app/dashboard/clients/actions.ts`:

In `createClientRecord`, add address and include it in the insert:
```typescript
  const phone = formData.get('phone') as string
  const address = (formData.get('address') as string) || null

  const { error } = await supabase.from('clients').insert({ name, email, phone, address })
```

In `updateClientRecord`, likewise:
```typescript
  const phone = formData.get('phone') as string
  const address = (formData.get('address') as string) || null

  const { error } = await supabase
    .from('clients')
    .update({ name, email, phone, address })
    .eq('id', id)
```

Change `deleteClientRecord` to soft-delete:
```typescript
  const supabase = await createClient()
  await supabase.from('clients').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/clients')
```

- [ ] **Step 2: List — filter active + Archivar label**

In `src/app/dashboard/clients/page.tsx`, change the query to add `.eq('active', true)`:
```typescript
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)
    .order('name')
```
Change the delete button label to `Archivar`.

- [ ] **Step 3: Address input on new & edit**

In `src/app/dashboard/clients/new/page.tsx`, after the phone `<div>`, add:
```tsx
      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Dirección
        </label>
        <input id="address" name="address" className="mt-1 w-full rounded border px-3 py-2" />
      </div>
```

In `src/app/dashboard/clients/[id]/edit/page.tsx`, after the phone `<div>`, add:
```tsx
      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Dirección
        </label>
        <input
          id="address"
          name="address"
          defaultValue={client.address ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/clients
git commit -m "feat: address field and soft-delete for clients"
```

---

## Task 7: Machines — model, client owner, soft-delete

**Files:**
- Modify: `src/app/dashboard/machines/{actions.ts,page.tsx,new/page.tsx,[id]/edit/page.tsx}`

- [ ] **Step 1: Actions — model + client_id + soft-delete**

In `src/app/dashboard/machines/actions.ts`:

In `createMachine`, add model and client_id fields and include them:
```typescript
  const name = formData.get('name') as string
  const serial_number = formData.get('serial_number') as string
  const model = (formData.get('model') as string) || null
  const brand_id = formData.get('brand_id') as string
  const type_id = formData.get('type_id') as string
  const client_id = (formData.get('client_id') as string) || null

  const { error } = await supabase
    .from('machines')
    .insert({ name, serial_number, model, brand_id, type_id, client_id })
```

In `updateMachine`, likewise add `model` and `client_id` to the read + update object:
```typescript
  const model = (formData.get('model') as string) || null
  const client_id = (formData.get('client_id') as string) || null

  const { error } = await supabase
    .from('machines')
    .update({ name, serial_number, model, brand_id, type_id, client_id })
    .eq('id', id)
```

Change `deleteMachine` to soft-delete:
```typescript
  const supabase = await createClient()
  await supabase.from('machines').update({ active: false }).eq('id', id)
  revalidatePath('/dashboard/machines')
```

- [ ] **Step 2: List — filter active, show model + owner**

In `src/app/dashboard/machines/page.tsx`, change the query:
```typescript
  const { data: machines } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name), clients(name)')
    .eq('active', true)
    .order('name')
```
Add a Modelo header after Serie and a Cliente header after Tipo:
```tsx
            <th className="p-2">Serie</th>
            <th className="p-2">Modelo</th>
            <th className="p-2">Marca</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Cliente</th>
```
Add the matching cells (Modelo after the serial cell, Cliente after the type cell):
```tsx
              <td className="p-2"><span className="mono">{machine.serial_number}</span></td>
              <td className="p-2"><span className="mono">{machine.model}</span></td>
              <td className="p-2">{machine.brands?.name}</td>
              <td className="p-2">{machine.machine_types?.name}</td>
              <td className="p-2">{machine.clients?.name}</td>
```
Change the delete button label to `Archivar`.

- [ ] **Step 3: New page — model input + client owner select**

In `src/app/dashboard/machines/new/page.tsx`, add clients to the parallel fetch:
```typescript
  const [{ data: brands }, { data: types }, { data: clients }] = await Promise.all([
    supabase.from('brands').select('*').eq('active', true).order('name'),
    supabase.from('machine_types').select('*').eq('active', true).order('name'),
    supabase.from('clients').select('*').eq('active', true).order('name'),
  ])
```
After the serial_number `<div>`, add a model input:
```tsx
      <div>
        <label htmlFor="model" className="block text-sm font-medium">
          Modelo
        </label>
        <input id="model" name="model" className="mt-1 w-full rounded border px-3 py-2" />
      </div>
```
After the type select `<div>`, add an optional client owner select:
```tsx
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium">
          Cliente dueño (opcional)
        </label>
        <select id="client_id" name="client_id" className="mt-1 w-full rounded border px-3 py-2">
          <option value="">— Sin asignar —</option>
          {(clients ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
```

- [ ] **Step 4: Edit page — model input + client owner select (prefilled)**

In `src/app/dashboard/machines/[id]/edit/page.tsx`, add clients to the parallel fetch (and keep `.eq('active', true)` on brands/types/clients):
```typescript
  const [{ data: machine }, { data: brands }, { data: types }, { data: clients }] =
    await Promise.all([
      supabase.from('machines').select('*').eq('id', id).single(),
      supabase.from('brands').select('*').eq('active', true).order('name'),
      supabase.from('machine_types').select('*').eq('active', true).order('name'),
      supabase.from('clients').select('*').eq('active', true).order('name'),
    ])
```
After the serial_number `<div>`, add a model input:
```tsx
      <div>
        <label htmlFor="model" className="block text-sm font-medium">
          Modelo
        </label>
        <input
          id="model"
          name="model"
          defaultValue={machine.model ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
```
After the type select `<div>`, add the client owner select prefilled with `machine.client_id`:
```tsx
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium">
          Cliente dueño (opcional)
        </label>
        <select
          id="client_id"
          name="client_id"
          defaultValue={machine.client_id ?? ''}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          <option value="">— Sin asignar —</option>
          {(clients ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
```

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/machines
git commit -m "feat: model, client owner, and soft-delete for machines"
```

---

## Task 8: Maintenances CRUD (internal)

**Files:**
- Create: `src/app/dashboard/maintenances/actions.ts`
- Create: `src/app/dashboard/maintenances/page.tsx`
- Create: `src/app/dashboard/maintenances/new/page.tsx`
- Create: `src/app/dashboard/maintenances/[id]/edit/page.tsx`

- [ ] **Step 1: Server actions**

Create `src/app/dashboard/maintenances/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'

function parseForm(formData: FormData) {
  return {
    machine_id: formData.get('machine_id') as string,
    technician_id: (formData.get('technician_id') as string) || null,
    date: formData.get('date') as string,
    description: formData.get('description') as string,
    is_corrective: formData.get('is_corrective') === 'on',
    cost: formData.get('cost') ? Number(formData.get('cost')) : null,
    status: formData.get('status') as string,
  }
}

export async function createMaintenance(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('maintenances').insert(parseForm(formData))

  if (error) {
    redirect(`/dashboard/maintenances/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/maintenances')
  redirect('/dashboard/maintenances')
}

export async function updateMaintenance(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('maintenances').update(parseForm(formData)).eq('id', id)

  if (error) {
    redirect(`/dashboard/maintenances/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/maintenances')
  redirect('/dashboard/maintenances')
}

export async function deleteMaintenance(id: string) {
  const { profile } = await requireUser()

  if (!canDelete(profile.role)) {
    throw new Error('No tienes permiso para eliminar.')
  }

  const supabase = await createClient()
  await supabase.from('maintenances').delete().eq('id', id)
  revalidatePath('/dashboard/maintenances')
}
```

- [ ] **Step 2: List page**

Create `src/app/dashboard/maintenances/page.tsx`:

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { canDelete } from '@/lib/permissions'
import { deleteMaintenance } from './actions'

export default async function MaintenancesPage() {
  const { profile } = await requireUser()
  const supabase = await createClient()
  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('*, machines(name), technician:profiles!technician_id(full_name)')
    .order('date', { ascending: false })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mantenimientos</h1>
        <Link href="/dashboard/maintenances/new" className="btn btn-primary">
          Nuevo mantenimiento
        </Link>
      </div>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Fecha</th>
            <th className="p-2">Máquina</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Técnico</th>
            <th className="p-2">Costo</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {(maintenances ?? []).map((m) => (
            <tr key={m.id} className="border-b text-sm">
              <td className="p-2"><span className="mono">{m.date}</span></td>
              <td className="p-2">{m.machines?.name}</td>
              <td className="p-2">{m.is_corrective ? 'Correctivo' : 'Preventivo'}</td>
              <td className="p-2">{m.status}</td>
              <td className="p-2">{m.technician?.full_name}</td>
              <td className="p-2"><span className="mono">{m.cost ?? ''}</span></td>
              <td className="flex gap-3 p-2">
                <Link href={`/dashboard/maintenances/${m.id}/edit`} className="link-edit">
                  Editar
                </Link>
                {canDelete(profile.role) && (
                  <form action={deleteMaintenance.bind(null, m.id)}>
                    <button type="submit" className="link-danger">
                      Eliminar
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

> Note: `technician:profiles!technician_id(full_name)` embeds the profile referenced
> by `technician_id`. If Supabase reports the relationship is ambiguous, use the FK
> constraint name hint `profiles!maintenances_technician_id_fkey(full_name)`.

- [ ] **Step 3: Shared form fields component**

Create `src/app/dashboard/maintenances/fields.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'

type MaintenanceDefaults = {
  machine_id?: string
  technician_id?: string | null
  date?: string
  description?: string
  is_corrective?: boolean
  cost?: number | null
  status?: string
}

export async function MaintenanceFields({ defaults }: { defaults?: MaintenanceDefaults }) {
  const supabase = await createClient()
  const [{ data: machines }, { data: staff }] = await Promise.all([
    supabase.from('machines').select('id, name').eq('active', true).order('name'),
    supabase.from('profiles').select('id, full_name, role').order('full_name'),
  ])
  const technicians = (staff ?? []).filter((p) => p.role === 'admin' || p.role === 'empleado')

  return (
    <>
      <div>
        <label htmlFor="machine_id" className="block text-sm font-medium">Máquina</label>
        <select id="machine_id" name="machine_id" required defaultValue={defaults?.machine_id ?? ''} className="mt-1 w-full rounded border px-3 py-2">
          <option value="" disabled>— Selecciona —</option>
          {(machines ?? []).map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="technician_id" className="block text-sm font-medium">Técnico responsable</label>
        <select id="technician_id" name="technician_id" defaultValue={defaults?.technician_id ?? ''} className="mt-1 w-full rounded border px-3 py-2">
          <option value="">— Sin asignar —</option>
          {technicians.map((t) => (<option key={t.id} value={t.id}>{t.full_name}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium">Fecha</label>
        <input id="date" name="date" type="date" required defaultValue={defaults?.date ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium">Estado</label>
        <select id="status" name="status" defaultValue={defaults?.status ?? 'programado'} className="mt-1 w-full rounded border px-3 py-2">
          <option value="programado">Programado</option>
          <option value="en_proceso">En proceso</option>
          <option value="completado">Completado</option>
        </select>
      </div>
      <div>
        <label htmlFor="cost" className="block text-sm font-medium">Costo</label>
        <input id="cost" name="cost" type="number" step="0.01" defaultValue={defaults?.cost ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_corrective" defaultChecked={defaults?.is_corrective ?? false} />
        Correctivo (si se desmarca, es preventivo)
      </label>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Descripción</label>
        <textarea id="description" name="description" required rows={3} defaultValue={defaults?.description ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
    </>
  )
}
```

- [ ] **Step 4: New page**

Create `src/app/dashboard/maintenances/new/page.tsx`:

```tsx
import { createMaintenance } from '../actions'
import { MaintenanceFields } from '../fields'

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <form action={createMaintenance} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo mantenimiento</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <MaintenanceFields />
      <button type="submit" className="btn btn-primary">Guardar</button>
    </form>
  )
}
```

- [ ] **Step 5: Edit page**

Create `src/app/dashboard/maintenances/[id]/edit/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateMaintenance } from '../../actions'
import { MaintenanceFields } from '../../fields'

export default async function EditMaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: m } = await supabase.from('maintenances').select('*').eq('id', id).single()

  if (!m) {
    notFound()
  }

  const updateWithId = updateMaintenance.bind(null, id)

  return (
    <form action={updateWithId} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Editar mantenimiento</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <MaintenanceFields
        defaults={{
          machine_id: m.machine_id,
          technician_id: m.technician_id,
          date: m.date,
          description: m.description,
          is_corrective: m.is_corrective,
          cost: m.cost,
          status: m.status,
        }}
      />
      <button type="submit" className="btn btn-primary">Guardar</button>
    </form>
  )
}
```

- [ ] **Step 6: Verify typecheck + manual smoke**

Run: `npx tsc --noEmit` (expect PASS). Then `npm run dev`, log in as the local staff admin, create a machine (with owner) if none exists, then create a maintenance at `/dashboard/maintenances/new`, confirm it appears in the list. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/maintenances
git commit -m "feat: maintenance registry CRUD (internal)"
```

---

## Task 9: Client portal access provisioning

**Files:**
- Modify: `src/app/dashboard/clients/actions.ts`
- Modify: `src/app/dashboard/clients/[id]/edit/page.tsx`

- [ ] **Step 1: Add the provisioning action**

In `src/app/dashboard/clients/actions.ts`, add imports at the top (alongside existing imports):
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
```
Then append a new action:
```typescript
export async function grantPortalAccess(clientId: string, formData: FormData) {
  await requireAdmin()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    redirect(
      `/dashboard/clients/${clientId}/edit?error=${encodeURIComponent(error?.message ?? 'Error desconocido')}`
    )
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    role: 'cliente',
    client_id: clientId,
  })

  if (profileError) {
    // Roll back the orphaned auth user so the email stays reusable.
    await admin.auth.admin.deleteUser(data.user.id)
    redirect(
      `/dashboard/clients/${clientId}/edit?error=${encodeURIComponent(profileError.message)}`
    )
  }

  revalidatePath(`/dashboard/clients/${clientId}/edit`)
  redirect(`/dashboard/clients/${clientId}/edit`)
}
```

- [ ] **Step 2: Show access state / form on the client edit page**

In `src/app/dashboard/clients/[id]/edit/page.tsx`, add imports:
```typescript
import { requireUser } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { updateClientRecord, grantPortalAccess } from '../../actions'
```
(remove the old `import { updateClientRecord } from '../../actions'` line — it is replaced by the line above.)

At the top of the component body, after `const supabase = await createClient()`, fetch role and existing access:
```typescript
  const { profile: currentProfile } = await requireUser()
  const { data: existingAccess } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('client_id', id)
    .maybeSingle()
```

After the closing `</form>` of the edit form, add a portal-access section (admin only):
```tsx
      {canManageUsers(currentProfile.role) && (
        <section className="mt-8 max-w-sm border-t pt-6">
          <h2 className="text-lg font-semibold">Acceso al portal</h2>
          {existingAccess ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Este cliente ya tiene acceso al portal ({existingAccess.full_name}).
            </p>
          ) : (
            <form action={grantPortalAccess.bind(null, id)} className="mt-3 space-y-3">
              <input type="hidden" name="full_name" value={client.name} />
              <div>
                <label htmlFor="access-email" className="block text-sm font-medium">Correo de acceso</label>
                <input id="access-email" name="email" type="email" required defaultValue={client.email ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label htmlFor="access-password" className="block text-sm font-medium">Contraseña temporal</label>
                <input id="access-password" name="password" type="password" required minLength={6} className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <button type="submit" className="btn btn-ghost">Habilitar acceso al portal</button>
            </form>
          )}
        </section>
      )}
```

> `edit/page.tsx` now renders two sibling blocks (the form + the section). Wrap the
> returned JSX in a `<div>…</div>` if it isn't already, so there is a single root
> element.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/clients
git commit -m "feat: admin can grant portal access to a client"
```

---

## Task 10: Client portal (read-only)

**Files:**
- Create: `src/app/portal/layout.tsx`
- Create: `src/app/portal/page.tsx`
- Create: `src/app/portal/machines/[id]/page.tsx`

- [ ] **Step 1: Portal layout (requires cliente)**

Create `src/app/portal/layout.tsx`:

```tsx
import { requireClient } from '@/lib/auth'
import { logout } from '../dashboard/actions'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireClient()

  return (
    <div className="min-h-screen">
      <header className="app-nav">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="brand shrink-0">
            <span className="brand-mark">AG</span>
            Portal
          </span>
          <form action={logout} className="flex items-center gap-3">
            <span className="hidden text-sm font-medium sm:block">{profile.full_name}</span>
            <button type="submit" className="btn btn-ghost">Salir</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Portal home — client ficha + their machines**

Create `src/app/portal/page.tsx`:

```tsx
import Link from 'next/link'
import { requireClient } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function PortalHome() {
  const { profile } = await requireClient()
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', profile.client_id ?? '')
    .maybeSingle()

  const { data: machines } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name)')
    .eq('client_id', profile.client_id ?? '')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow">Mi información</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{client?.name}</h1>
        <div className="mt-3 text-sm text-[var(--muted)]">
          {client?.email && <p>Correo: {client.email}</p>}
          {client?.phone && <p>Teléfono: {client.phone}</p>}
          {client?.address && <p>Dirección: {client.address}</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Mis máquinas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(machines ?? []).map((m) => (
            <Link key={m.id} href={`/portal/machines/${m.id}`} className="card p-5 transition-shadow hover:shadow-[var(--shadow)]">
              <span className="text-base font-semibold">{m.name}</span>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {m.brands?.name} · {m.machine_types?.name}
                {m.model ? ` · ${m.model}` : ''}
              </p>
            </Link>
          ))}
          {(machines ?? []).length === 0 && (
            <p className="text-sm text-[var(--muted)]">No tienes máquinas registradas.</p>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Portal machine detail — maintenance history**

Create `src/app/portal/machines/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { requireClient } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function PortalMachinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { profile } = await requireClient()
  const supabase = await createClient()

  // RLS already restricts to the client's own machines; the explicit client_id
  // filter is defense in depth.
  const { data: machine } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name)')
    .eq('id', id)
    .eq('client_id', profile.client_id ?? '')
    .maybeSingle()

  if (!machine) {
    notFound()
  }

  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('*')
    .eq('machine_id', id)
    .order('date', { ascending: false })

  return (
    <div>
      <p className="eyebrow">Máquina</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{machine.name}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {machine.brands?.name} · {machine.machine_types?.name}
        {machine.model ? ` · ${machine.model}` : ''}
        {machine.serial_number ? ` · Serie ${machine.serial_number}` : ''}
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">Historial de mantenimientos</h2>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Fecha</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {(maintenances ?? []).map((m) => (
            <tr key={m.id} className="border-b text-sm">
              <td className="p-2"><span className="mono">{m.date}</span></td>
              <td className="p-2">{m.is_corrective ? 'Correctivo' : 'Preventivo'}</td>
              <td className="p-2">{m.status}</td>
              <td className="p-2">{m.description}</td>
            </tr>
          ))}
          {(maintenances ?? []).length === 0 && (
            <tr><td className="p-2 text-sm text-[var(--muted)]" colSpan={4}>Sin mantenimientos registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/portal
git commit -m "feat: read-only client portal (ficha, machines, maintenance history)"
```

---

## Task 11: E2E tests (portal, maintenance, soft-delete) + fix Fase 1 delete test

**Files:**
- Create: `tests/e2e/portal.spec.ts`
- Create: `tests/e2e/maintenances.spec.ts`
- Modify: `tests/e2e/clients-crud.spec.ts` (button renamed to "Archivar")
- Modify: `.env.local` (add a portal test client's credentials — not committed)

- [ ] **Step 1: Seed a test client with portal access (manual, local)**

Run `npm run dev`, log in as the local admin, create a client "Cliente Portal Test", open its edit page, and use "Habilitar acceso al portal" with email `portal@agservicios.local` / password `changeme123`. Assign at least one machine's owner to this client. Stop the dev server.

Add to `.env.local` (NOT committed):
```
E2E_CLIENT_EMAIL=portal@agservicios.local
E2E_CLIENT_PASSWORD=changeme123
```

- [ ] **Step 2: Fix the Fase 1 clients-crud delete step**

In `tests/e2e/clients-crud.spec.ts`, change the delete button name from `'Eliminar'` to `'Archivar'`:
```typescript
    .getByRole('button', { name: 'Archivar' })
```

- [ ] **Step 3: Portal E2E**

Create `tests/e2e/portal.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('un cliente entra a su portal y no puede ver el dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_CLIENT_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_CLIENT_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/portal/)
  await expect(page.getByText('Mis máquinas')).toBeVisible()

  // A client cannot reach the internal dashboard; it redirects back to /portal.
  await page.goto('/dashboard/clients')
  await expect(page).toHaveURL(/\/portal/)
})
```

- [ ] **Step 4: Maintenance E2E (staff creates, appears in list)**

Create `tests/e2e/maintenances.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('staff registra un mantenimiento y aparece en la lista', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/dashboard/maintenances/new')
  await page.getByLabel('Máquina').selectOption({ index: 1 })
  await page.getByLabel('Fecha').fill('2026-07-23')
  await page.getByLabel('Descripción').fill('Cambio de aceite E2E')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText('Cambio de aceite E2E')).toBeVisible()
})
```

- [ ] **Step 5: Run the whole E2E suite**

Run: `npm run test:e2e`
Expected: all specs pass (auth, clients-crud, portal, maintenances). If the maintenance test cannot select a machine (none exist), ensure Step 1 created a machine.

- [ ] **Step 6: Run unit tests + build**

Run: `npm run test:unit` (expect 15 passed) then `npx next build` (expect success, routes include `/portal` and `/dashboard/maintenances`).

- [ ] **Step 7: Commit**

```bash
git add tests/e2e
git commit -m "test: E2E for client portal, maintenance registry, and soft-delete rename"
```

---

## Task 12: Apply to cloud + deploy

**Files:** none (operational).

- [ ] **Step 1: Push code to GitHub (auto-deploys to Vercel)**

```bash
git push origin master
```

- [ ] **Step 2: Apply the new migrations to the cloud project**

Run: `npx supabase db push`
Expected: applies `20260724000000_fase2_schema.sql` and `20260724000001_fase2_rls.sql`. (The `pg-delta catalog cache` warning is non-fatal.)

- [ ] **Step 3: Verify production**

Visit the Vercel URL, log in as a staff admin → `/dashboard` with the new Mantenimientos section. Create/assign as needed, grant a client portal access, then log in as that client → `/portal` shows only their machines and maintenance history.

---

## Plan Self-Review Notes

- **Spec coverage:** schema/fields/soft-delete/ownership/maintenances/cliente role (Tasks 1–2); role-aware RLS (Task 2); role helpers + guards + routing (Tasks 3–4); internal field additions + soft-delete (Tasks 5–7); maintenance CRUD (Task 8); portal access provisioning (Task 9); read-only portal (Task 10); testing (Task 11); cloud deploy (Task 12). All spec sections map to a task.
- **Soft-delete + RLS interaction:** archiving is an UPDATE guarded by `canDelete` (admin) in the action layer, consistent with Fase 1; RLS allows staff UPDATE. Lists filter `active=true`.
- **Type consistency:** `Role = 'admin' | 'empleado' | 'cliente'` defined once; `isStaff`/`isClient`/`homePathForRole` used consistently in auth guards, routing, and tests; maintenance form field names (`machine_id`, `technician_id`, `date`, `description`, `is_corrective`, `cost`, `status`) match between `fields.tsx`, `parseForm`, and the DB columns.
- **Defense in depth:** portal queries filter by `profile.client_id` in addition to RLS.
```
