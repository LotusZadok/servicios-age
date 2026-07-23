# AGServicios — Herramienta interna (Fase 1)

Sistema de gestión de clientes, máquinas, marcas y tipos de maquinaria para el
negocio de alquiler/servicio de maquinaria. Reemplaza el proyecto original
(Android/Flask/SQL Server, en `AGServicios-main`) con una app web Next.js +
Supabase.

Diseño: `docs/superpowers/specs/2026-07-23-gestion-maquinaria-web-fase1-design.md`
Plan de implementación: `docs/superpowers/plans/2026-07-23-fase1-herramienta-interna.md`

## Requisitos

- Node.js 20+
- Docker Desktop (para Supabase local)
- Cuenta de Supabase (capa gratuita) para producción

## Desarrollo local

1. `npm install`
2. `npx supabase start` — levanta Postgres/Auth local vía Docker
3. Copiar `.env.local.example` a `.env.local` y llenar con las claves que imprime
   `supabase start`
4. `npx tsx scripts/seed-admin.ts <email> <password> "<nombre>"` — crea el primer
   usuario admin (solo la primera vez)
5. `npm run dev` — abre `http://localhost:3000`

## Tests

- `npm run test:unit` — Vitest (lógica de permisos)
- `npm run test:e2e` — Playwright (requiere `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`
  en `.env.local`, apuntando a un admin creado con el script de seed)

## Despliegue

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push` — aplica las migraciones al proyecto en la nube
4. Correr `scripts/seed-admin.ts` apuntando a las credenciales de producción para
   crear el primer admin
5. Desplegar este repo en [Vercel](https://vercel.com), configurando
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y
   `SUPABASE_SERVICE_ROLE_KEY` como variables de entorno del proyecto (nunca
   hardcodeadas en el código)
