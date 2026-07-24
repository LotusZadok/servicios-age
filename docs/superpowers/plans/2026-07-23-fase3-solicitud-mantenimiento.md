# Fase 3: Solicitud de mantenimiento por el cliente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a client request a maintenance for one of their machines (status `solicitado`, description only); staff see incoming requests via an in-app counter and schedule or cancel them.

**Architecture:** A migration adds the `solicitado`/`cancelado` statuses, makes `maintenances.date` nullable, and adds a client-only INSERT policy tightly shaped (own active machine, `solicitado`, no date/technician/cost). The portal gains a request form + server action; staff side gains new status options, optional date, requests-first ordering with a badge, and a pending-request counter in the nav. RLS is the primary write gate; the portal action also verifies ownership.

**Tech Stack:** Next.js 16 (App Router, TS), Tailwind v4, @supabase/ssr + supabase-js, Supabase CLI (local Postgres via Docker), Vitest, Playwright.

Spec: `docs/superpowers/specs/2026-07-23-fase3-solicitud-mantenimiento-design.md`

**Prerequisites:** Docker Desktop running + local Supabase up. Prefix supabase CLI commands with the Docker bin on PATH (PowerShell): `$env:PATH = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;$env:PATH"`. A seeded portal client exists locally (`portal@agservicios.local` / `changeme123`) owning at least one machine (from `scripts/seed-portal-test.ts`); if missing, run `npx tsx scripts/seed-portal-test.ts`.

---

## File Structure

```
src/
├── lib/
│   └── maintenances.ts                       # CREATE: isRequest / sortRequestsFirst (pure)
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx                        # MODIFY: pending-request counter on the nav link
│   │   └── maintenances/
│   │       ├── fields.tsx                    # MODIFY: solicitado/cancelado options; date not required
│   │       ├── actions.ts                    # MODIFY: parseForm date '' -> null
│   │       └── page.tsx                       # MODIFY: requests first + "Solicitado" badge
│   └── portal/
│       └── machines/[id]/
│           ├── actions.ts                     # CREATE: requestMaintenance server action
│           └── page.tsx                       # MODIFY: request form + error + null-date display
├── supabase/migrations/
│   └── 20260724000003_fase3_maintenance_requests.sql   # CREATE
└── tests/
    ├── unit/maintenances.test.ts             # CREATE
    └── e2e/maintenance-requests.spec.ts      # CREATE
```

---

## Task 1: Migration — statuses, nullable date, client insert policy

**Files:**
- Create: `supabase/migrations/20260724000003_fase3_maintenance_requests.sql`
- Modify: `src/lib/database.types.ts` (regenerated)

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260724000003_fase3_maintenance_requests.sql`:

```sql
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
```

> Note: `maintenances_status_check` is the auto-generated name from the Fase 2 inline
> check. If `migration up` reports it doesn't exist, find the real name with
> `npx supabase db query "select conname from pg_constraint where conrelid='public.maintenances'::regclass and contype='c';"` and adjust the drop line.

- [ ] **Step 2: Apply locally**

Run (Docker PATH prefixed): `npx supabase migration up`
Expected: `Applying migration 20260724000003_fase3_maintenance_requests.sql...` then `Migrations applied`. (The wrapped node.exe stderr line about "Connecting to local database..." is benign.)

- [ ] **Step 3: Verify the policy and constraint**

Run: `npx supabase db query "select polname from pg_policy where polrelid='public.maintenances'::regclass;"`
Expected: includes `maintenances_insert_client` alongside the Fase 2 policies.

- [ ] **Step 4: Regenerate types**

Run (PowerShell): `npx supabase gen types typescript --local | Out-File -Encoding utf8 src/lib/database.types.ts`
Then strip the BOM (Bash): `sed -i '1s/^\xEF\xBB\xBF//' src/lib/database.types.ts`
Then run `npx tsc --noEmit` — expect PASS. (`date` becomes `string | null` in the Row type; the maintenance form/actions already treat it as nullable-friendly after Task 4.)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260724000003_fase3_maintenance_requests.sql src/lib/database.types.ts
git commit -m "feat(db): maintenance requests - statuses, nullable date, client insert policy"
```

---

## Task 2: Pure maintenance helpers (TDD)

**Files:**
- Create: `src/lib/maintenances.ts`
- Test: `tests/unit/maintenances.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/maintenances.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { isRequest, sortRequestsFirst } from '@/lib/maintenances'

describe('isRequest', () => {
  it('true for solicitado', () => expect(isRequest('solicitado')).toBe(true))
  it('false for programado', () => expect(isRequest('programado')).toBe(false))
  it('false for completado', () => expect(isRequest('completado')).toBe(false))
})

describe('sortRequestsFirst', () => {
  it('puts solicitado rows before others', () => {
    const rows = [
      { status: 'completado', date: '2026-07-10', created_at: '2026-07-10T00:00:00Z' },
      { status: 'solicitado', date: null, created_at: '2026-07-05T00:00:00Z' },
      { status: 'programado', date: '2026-07-20', created_at: '2026-07-15T00:00:00Z' },
    ]
    const sorted = sortRequestsFirst(rows)
    expect(sorted[0].status).toBe('solicitado')
  })

  it('orders non-requests by newest date first', () => {
    const rows = [
      { status: 'completado', date: '2026-07-10', created_at: '2026-07-10T00:00:00Z' },
      { status: 'programado', date: '2026-07-20', created_at: '2026-07-15T00:00:00Z' },
    ]
    const sorted = sortRequestsFirst(rows)
    expect(sorted[0].date).toBe('2026-07-20')
  })

  it('does not mutate the input array', () => {
    const rows = [
      { status: 'completado', date: '2026-07-10', created_at: '2026-07-10T00:00:00Z' },
      { status: 'solicitado', date: null, created_at: '2026-07-05T00:00:00Z' },
    ]
    const copy = [...rows]
    sortRequestsFirst(rows)
    expect(rows).toEqual(copy)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test:unit`
Expected: FAIL — cannot import `isRequest` / `sortRequestsFirst`.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/maintenances.ts`:

```typescript
export function isRequest(status: string): boolean {
  return status === 'solicitado'
}

// Pending client requests first; within each group, newest first. A request has
// no scheduled date, so it falls back to created_at for the secondary sort.
export function sortRequestsFirst<
  T extends { status: string; date: string | null; created_at: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = isRequest(a.status) ? 0 : 1
    const rb = isRequest(b.status) ? 0 : 1
    if (ra !== rb) return ra - rb
    const da = a.date ?? a.created_at
    const db = b.date ?? b.created_at
    return db.localeCompare(da)
  })
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm run test:unit`
Expected: PASS (permissions tests + the new maintenance tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/maintenances.ts tests/unit/maintenances.test.ts
git commit -m "feat: add maintenance request helpers (isRequest, sortRequestsFirst)"
```

---

## Task 3: Portal — request form + action

**Files:**
- Create: `src/app/portal/machines/[id]/actions.ts`
- Modify: `src/app/portal/machines/[id]/page.tsx`

- [ ] **Step 1: Server action**

Create `src/app/portal/machines/[id]/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireClient } from '@/lib/auth'

export async function requestMaintenance(machineId: string, formData: FormData) {
  const { profile } = await requireClient()
  const description = formData.get('description') as string
  const supabase = await createClient()

  // Defense in depth: confirm the machine belongs to this client and is active.
  const { data: machine } = await supabase
    .from('machines')
    .select('id')
    .eq('id', machineId)
    .eq('client_id', profile.client_id ?? '')
    .eq('active', true)
    .maybeSingle()

  if (!machine) {
    redirect(`/portal/machines/${machineId}?error=${encodeURIComponent('Máquina no válida.')}`)
  }

  const { error } = await supabase.from('maintenances').insert({
    machine_id: machineId,
    description,
    status: 'solicitado',
  })

  if (error) {
    redirect(`/portal/machines/${machineId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/portal/machines/${machineId}`)
  redirect(`/portal/machines/${machineId}`)
}
```

- [ ] **Step 2: Add the form + error + null-date display to the machine page**

Modify `src/app/portal/machines/[id]/page.tsx`. Replace its full contents with:

```tsx
import { notFound } from 'next/navigation'
import { requireClient } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { requestMaintenance } from './actions'

export default async function PortalMachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const { profile } = await requireClient()
  const supabase = await createClient()

  // RLS already restricts to the client's own machines; the explicit client_id
  // filter is defense in depth.
  const { data: machine } = await supabase
    .from('machines')
    .select('*, brands(name), machine_types(name)')
    .eq('id', id)
    .eq('client_id', profile.client_id ?? '')
    .eq('active', true)
    .maybeSingle()

  if (!machine) {
    notFound()
  }

  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('*')
    .eq('machine_id', id)
    .order('created_at', { ascending: false })

  const requestForMachine = requestMaintenance.bind(null, id)

  return (
    <div>
      <p className="eyebrow">Máquina</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{machine.name}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {machine.brands?.name} · {machine.machine_types?.name}
        {machine.model ? ` · ${machine.model}` : ''}
        {machine.serial_number ? ` · Serie ${machine.serial_number}` : ''}
      </p>

      <section className="card mt-6 max-w-md p-5">
        <h2 className="text-lg font-semibold">Solicitar mantenimiento</h2>
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
        <form action={requestForMachine} className="mt-3 space-y-3">
          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              ¿Qué necesita?
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <button type="submit" className="btn btn-primary">Enviar solicitud</button>
        </form>
      </section>

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
              <td className="p-2"><span className="mono">{m.date ?? '—'}</span></td>
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

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/portal/machines/[id]"
git commit -m "feat: client can request maintenance from the portal"
```

---

## Task 4: Staff side — statuses, optional date, requests-first, nav counter

**Files:**
- Modify: `src/app/dashboard/maintenances/fields.tsx`
- Modify: `src/app/dashboard/maintenances/actions.ts`
- Modify: `src/app/dashboard/maintenances/page.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Add new status options + make date optional in the editor**

In `src/app/dashboard/maintenances/fields.tsx`:

Change the date input (remove `required`):
```tsx
        <input id="date" name="date" type="date" defaultValue={defaults?.date ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
```

Change the status select to include the new states:
```tsx
        <select id="status" name="status" defaultValue={defaults?.status ?? 'programado'} className="mt-1 w-full rounded border px-3 py-2">
          <option value="solicitado">Solicitado</option>
          <option value="programado">Programado</option>
          <option value="en_proceso">En proceso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
```

- [ ] **Step 2: parseForm — empty date becomes null**

In `src/app/dashboard/maintenances/actions.ts`, in `parseForm`, change the `date` line:
```typescript
    date: (formData.get('date') as string) || null,
```
(so scheduling a request without a date, or clearing it, stores null instead of an empty string that Postgres would reject).

- [ ] **Step 3: List — requests first + "Solicitado" badge**

In `src/app/dashboard/maintenances/page.tsx`:

Add imports at the top (alongside existing imports):
```typescript
import { isRequest, sortRequestsFirst } from '@/lib/maintenances'
```

Change the query ordering to `created_at` and sort in JS. Replace the query block:
```typescript
  const { data: maintenances } = await supabase
    .from('maintenances')
    .select('*, machines(name), technician:profiles!technician_id(full_name)')
    .order('created_at', { ascending: false })

  const ordered = sortRequestsFirst(maintenances ?? [])
```

Change the row map to iterate `ordered` instead of `(maintenances ?? [])`:
```tsx
          {ordered.map((m) => (
```

Change the Estado cell to badge requests. Replace:
```tsx
              <td className="p-2">{m.status}</td>
```
with:
```tsx
              <td className="p-2">
                {isRequest(m.status) ? (
                  <span className="rounded bg-[var(--accent-weak)] px-2 py-0.5 text-xs font-medium text-[var(--accent-ink)]">
                    Solicitado
                  </span>
                ) : (
                  m.status
                )}
              </td>
```

And the date cell must tolerate null:
```tsx
              <td className="p-2"><span className="mono">{m.date ?? '—'}</span></td>
```

- [ ] **Step 4: Nav counter for pending requests**

In `src/app/dashboard/layout.tsx`:

Add an import for the server Supabase client at the top:
```typescript
import { createClient } from '@/lib/supabase/server'
```

Inside the component, after `const { profile } = await requireStaff()`, add a lightweight head count:
```typescript
  const supabase = await createClient()
  const { count } = await supabase
    .from('maintenances')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'solicitado')
  const pending = count ?? 0
  const maintenancesLabel = pending > 0 ? `Mantenimientos (${pending})` : 'Mantenimientos'
```

Change the Mantenimientos nav link to use the label:
```tsx
            <NavLink href="/dashboard/maintenances">{maintenancesLabel}</NavLink>
```

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/maintenances src/app/dashboard/layout.tsx
git commit -m "feat: staff see requests first, a Solicitado badge, and a pending counter"
```

---

## Task 5: E2E tests + manual

**Files:**
- Create: `tests/e2e/maintenance-requests.spec.ts`
- Modify: `docs/manual-usuario.md`

- [ ] **Step 1: Ensure the portal test seed exists**

Run: `npx tsx scripts/seed-portal-test.ts` (idempotent; ensures `portal@agservicios.local` owns machine "Excavadora E2E"). Confirm it prints `Portal E2E seed OK`.

- [ ] **Step 2: Write the E2E**

Create `tests/e2e/maintenance-requests.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('un cliente solicita un mantenimiento y el staff lo ve como pendiente', async ({ page }) => {
  // Client requests a maintenance from its machine.
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_CLIENT_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_CLIENT_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/portal/, { timeout: 15000 })

  await page.getByRole('link', { name: /Excavadora E2E/ }).click()
  await expect(page).toHaveURL(/\/portal\/machines\//)

  const descripcion = `Ruido extraño ${Date.now()}`
  await page.getByLabel('¿Qué necesita?').fill(descripcion)
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()

  // The request shows in this machine's history as "solicitado".
  await expect(page.getByRole('cell', { name: descripcion })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'solicitado' }).first()).toBeVisible()

  // Staff sees a pending indicator and a "Solicitado" badge.
  await page.getByRole('button', { name: 'Salir' }).click()
  await page.goto('/login')
  await page.getByLabel('Correo').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Contraseña').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await expect(page.getByRole('link', { name: /Mantenimientos \(\d+\)/ })).toBeVisible()
  await page.goto('/dashboard/maintenances')
  await expect(page.getByText('Solicitado').first()).toBeVisible()
})
```

> Note on the portal history assertion: the staff list shows a "Solicitado" badge,
> while the portal history table shows the raw status text `solicitado` (lowercase).
> The client-side assertion targets the lowercase cell; the staff-side assertion
> targets the badge text `Solicitado`.

- [ ] **Step 3: Run the whole E2E suite**

Run: `npm run test:e2e`
Expected: all specs pass (auth, clients-crud, portal, maintenances, maintenance-requests). If a request cell is not unique across reruns, the `descripcion` is timestamped so it stays unique.

- [ ] **Step 4: Unit + build**

Run: `npm run test:unit` (expect the permissions + maintenance helper tests to pass) then `npx next build` (expect success).

- [ ] **Step 5: Update the user manual**

In `docs/manual-usuario.md`, in the "Mantenimientos" section (section 5), after the status list, add:

```markdown
### Solicitudes de clientes (estado "solicitado")
Un cliente puede **solicitar** un mantenimiento desde el portal, en la página de su
máquina (solo una descripción de lo que necesita). Llega como estado **solicitado**:
- Aparece **destacada y primero** en la lista de Mantenimientos, y la navegación
  muestra un **contador** de solicitudes pendientes (ej. "Mantenimientos (3)").
- El staff la **agenda** abriéndola y cambiando el estado a *programado*, con fecha,
  técnico y costo; o la **cancela** (estado *cancelado*) si no se realizará.
- El cliente solo puede crear la solicitud: no puede editarla ni cancelarla; ve su
  avance en el historial de la máquina.
```

Also, in section 8 ("Portal del cliente"), change the parenthetical
"(Editar su ficha o solicitar mantenimientos se evaluará en una fase futura.)" to:
```markdown
El cliente sí puede **solicitar un mantenimiento** desde la página de cada máquina
(ver sección 5). Editar su propia ficha se evaluará en una fase futura.
```

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/maintenance-requests.spec.ts docs/manual-usuario.md
git commit -m "test: E2E for maintenance requests; document the request flow"
```

---

## Task 6: Deploy

**Files:** none (operational).

- [ ] **Step 1: Push code (auto-deploys to Vercel)**

```bash
git push origin master
```

- [ ] **Step 2: Apply the migration to cloud**

Run: `npx supabase db push`
Expected: applies `20260724000003_fase3_maintenance_requests.sql`. (The `pg-delta catalog cache` warning is non-fatal.)

- [ ] **Step 3: Verify production**

As a client (a portal login), open a machine, submit a request, and confirm it shows as `solicitado`. As staff, confirm the "Mantenimientos (n)" counter and the "Solicitado" badge appear, and that scheduling the request (status → programado + date) removes it from the pending count.

---

## Plan Self-Review Notes

- **Spec coverage:** statuses + nullable date + client insert policy (Task 1); requests-first ordering + counter helpers (Task 2); portal request form + action (Task 3); staff statuses/optional-date/ordering/badge/counter (Task 4); tests + manual (Task 5); deploy (Task 6). All spec sections map to a task.
- **RLS is the write gate:** the client insert policy fixes the row shape (own active machine, `solicitado`, no date/technician/cost); the portal action adds an ownership re-check. No client update/delete policy is added.
- **Type consistency:** `isRequest`/`sortRequestsFirst` signatures match between `src/lib/maintenances.ts`, the unit test, and the list page usage; `parseForm` now emits `date: string | null`, consistent with the nullable `date` column and the editor's non-required date input; status strings (`solicitado`, `programado`, `en_proceso`, `completado`, `cancelado`) match between the migration check, the editor select, and the badge logic.
- **Null date** is rendered as `—` in both the portal history and the staff list, and stored as null by `parseForm`.
```
