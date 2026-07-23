# Fase 1: Herramienta interna web para gestión de maquinaria (AGServicios)

## Contexto

`AGServicios` fue un proyecto de curso de ingeniería de software (2023): app Android
nativa (Kotlin) + API en Flask/Python + SQL Server con 25 stored procedures.
Gestiona clientes, máquinas, marcas y tipos de maquinaria para un negocio real de
alquiler/servicio de maquinaria (propio/familiar).

Objetivo: convertirlo en una herramienta real para ese negocio. El sistema completo
tendrá tres tipos de usuario: `admin`, `empleado` (fase 1) y `cliente` (fase 2, portal
externo). Este documento cubre solo **fase 1**: la herramienta interna web para
admin/empleado. El portal de clientes es un proyecto separado que se diseñará después
de que esta fase esté funcionando.

Este es un proyecto nuevo e independiente del código Android/Flask/SQL Server
original (`AGServicios-main`), que se conserva como referencia histórica pero deja de
recibir desarrollo.

## Arquitectura

Un solo proyecto Next.js (App Router, TypeScript) desplegado en Vercel:

```
Next.js app (Vercel)
 ├─ UI (React) — login, dashboard, CRUD de clientes/máquinas/marcas/tipos, reportes
 ├─ Server Actions / Route Handlers — lógica de negocio (reemplaza los endpoints Flask)
 └─ Supabase client — Postgres (datos) + Auth (login/roles)
```

- **Supabase** reemplaza SQL Server: Postgres administrado, con capa gratuita
  suficiente para este tamaño de negocio. Incluye Auth y (si hace falta más adelante)
  Storage.
- Las 25 stored procedures actuales (que arman JSON a mano en SQL) se retiran. La
  lógica de CRUD vive en código de aplicación tipado (ORM — Drizzle o el cliente de
  Supabase directamente), más fácil de mantener y testear que SQL crudo.
- El esquema de `ModeloBD/script_BD_V6.sql` y `SPs/` se migra a Postgres vía
  migraciones versionadas de Supabase (no un script único a mano). No hay datos
  existentes que migrar — el negocio no opera hoy sobre esta base de datos.

## Autenticación y roles

- **Supabase Auth** maneja login (email + contraseña). Reemplaza el hash manual con
  `bcrypt` del backend actual.
- Tabla `profiles` vinculada a cada usuario de Auth, con campo `role`: `admin` |
  `empleado` en fase 1. En fase 2 se añade `cliente` como un valor más de este campo,
  sin rediseñar el modelo de autenticación.
- **Row Level Security (RLS)** en Postgres aplica los permisos directamente en la base
  de datos, no solo en el frontend:
  - `admin`: acceso completo (CRUD de clientes/máquinas/marcas/tipos + gestión de
    usuarios internos).
  - `empleado`: puede crear/editar clientes y máquinas; no puede eliminar registros ni
    gestionar cuentas de usuario.
- Se elimina cualquier credencial o URL hardcodeada (ej. el túnel ngrok hardcodeado en
  el Android actual).

## Funcionalidad

Migración funcional 1:1 del catálogo actual, en web:

- CRUD completo de **Clientes**, **Máquinas**, **Marcas** y **Tipos de Maquinaria**
  (crear, ver, editar, eliminar, listar).
- **Gestión de usuarios internos**: crear cuentas, asignar rol (`admin`/`empleado`).
- **Reporte**: listado exportable del catálogo (clientes/máquinas/marcas/tipos), en
  formato PDF o Excel. Alcance equivalente al `GenerarReporteActivity` actual del
  Android.

Explícitamente fuera de alcance en fase 1:
- Registro de alquileres/transacciones (qué máquina se alquiló a qué cliente, por
  cuánto tiempo, costo). No existía en el proyecto original; se evaluará como fase
  futura si el negocio lo necesita.
- Portal de clientes (fase 2).

## Testing

- **Vitest**: lógica de CRUD y de permisos por rol (admin vs. empleado).
- **Playwright**: flujos clave end-to-end — login, crear/editar/eliminar cliente y
  máquina, exportar reporte.
- No se busca cobertura exhaustiva en fase 1, solo cubrir el camino feliz y la
  separación de permisos por rol. Esto reemplaza el único test existente hoy (un
  smoke test de pytest contra `/login`).

## Despliegue

- Repo nuevo en GitHub, sin relación con el proyecto Android/Flask original.
- Frontend + backend (un solo proyecto Next.js) desplegado en Vercel, conectado a ese
  repo.
- Supabase como proyecto aparte (Postgres + Auth).
- Variables de entorno (URL/keys de Supabase) gestionadas en Vercel, nunca
  hardcodeadas en el código — corrige el problema de la URL de ngrok hardcodeada que
  tenía la app Android.

## Qué pasa con el proyecto original

`AGServicios-main` (Android, Flask, SQL Server, stored procedures) se conserva sin
cambios como referencia histórica. No recibe más desarrollo; todo el trabajo nuevo
ocurre en este proyecto (`AGServicios-web`).
