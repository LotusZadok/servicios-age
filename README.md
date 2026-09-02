# Servicios AGE

[![CI](https://github.com/LotusZadok/servicios-age/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/LotusZadok/servicios-age/actions/workflows/ci.yml)

Servicios AGE maintains industrial equipment — mostly forklifts — for companies in
Costa Rica, and until mid-2026 recorded every service job in an Excel workbook. This
replaces it with two applications over one database: an internal panel where staff
manage clients, their store locations, machines, brands, machine types and
maintenance records and export the catalog as CSV, and a separate portal where each
client sees only its own equipment and service history and can request service. The
case that paid for the project was showing a client the work done on a machine over
a period without rebuilding the report by hand. Authorization is enforced in
Postgres through row-level security rather than at the route layer, and a
maintenance record stores the location where the work happened as a snapshot, so
lending a machine between stores never rewrites its history.

**Built and deployed, but not yet in real use.** No business data has been loaded,
no internal accounts exist beyond the developer's, and no client has portal access.

Stack: Next.js 16 (App Router) and TypeScript on Vercel, Supabase for Postgres,
Auth and row-level security, Tailwind v4, Vitest and Playwright. The full technical
picture is in [`docs/manual-tecnico.md`](docs/manual-tecnico.md).

## Requirements

- Node 20 or newer
- Docker, for the local Supabase instance

The Supabase CLI ships as a dev dependency and runs through `npx` — no global
install.

## Local setup

```bash
npm install
npx supabase start        # local Postgres and Auth in Docker
```

`supabase start` prints the credentials for the local instance. Copy
`.env.local.example` to `.env.local` and fill it in:

| Printed as         | Goes into                       |
| ------------------ | ------------------------------- |
| `API URL`          | `NEXT_PUBLIC_SUPABASE_URL`      |
| `anon key`         | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role key` | `SUPABASE_SERVICE_ROLE_KEY`     |

The four `E2E_*` variables are not printed by anything. `E2E_ADMIN_EMAIL` and
`E2E_ADMIN_PASSWORD` are yours to choose, and have to match what you pass to the
seed script below. `E2E_CLIENT_EMAIL` and `E2E_CLIENT_PASSWORD` are fixed by
`scripts/seed-portal-test.ts` — the values are in `.env.local.example`.

Then apply the schema, create the first administrator, and seed the client-side
test data:

```bash
npx supabase db reset
npx tsx scripts/seed-admin.ts <email> <password> "<full name>"
npx tsx scripts/seed-portal-test.ts
npm run dev
```

`seed-admin.ts` requires all three arguments. Without them it prints its usage and
exits, leaving the database with no administrator while the rest of the setup looks
like it worked.

The portal seed is not optional if you intend to run the tests: several specs need
a client account with at least one machine, and the maintenance form needs a
machine to select.

Before the first end-to-end run, install the browsers once:

```bash
npx playwright install
```

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest, `tests/unit/` |
| `npm run test:e2e` | Playwright, `tests/e2e/` |

Migrations are applied with `supabase db push`, which is a separate manual step —
deploying the app does not apply them.

## Documentation

Project documentation is written in Spanish, because the business and whoever
maintains this are Spanish speakers. Anything addressed outward, including this
file, is in English.

| Document | What it covers |
| --- | --- |
| [`docs/manual-usuario.md`](docs/manual-usuario.md) | Operating manual, organized by role and by task |
| [`docs/manual-tecnico.md`](docs/manual-tecnico.md) | Stack, data model, authorization, migrations, environment, deployment, tests, scope limits |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Five reference diagrams and the decisions behind them |
| [`docs/marca.md`](docs/marca.md) | Brand system, asset inventory and contrast ratios |
| [`docs/resumen-academico.md`](docs/resumen-academico.md) | Short defensible summary of the architecture, for the developer |
| [`docs/design/`](docs/design/) | Dated design records, kept unedited |
| [`docs/screenshots/`](docs/screenshots/) | Screenshots of the panel and the portal, from seeded development data |

The records in `docs/design/` state what was decided before each phase was built.
They do not always describe the system as it stands; the note at the top of each
says what changed.
