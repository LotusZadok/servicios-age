-- anon no debe poder ejecutar funciones ni usar secuencias de `public`, ni las
-- de hoy ni las que cree una migración futura (ver la migración 10).
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select is(
  (select array_agg(p.proname::text order by p.proname)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')),
  null,
  'anon no ejecuta ninguna función de public'
);

select is(
  (select array_agg(c.relname::text order by c.relname)
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    -- El CASE impide evaluar has_sequence_privilege sobre algo que no es
    -- secuencia (pgTAP crea tipos en public): Postgres no garantiza el orden del AND.
    where n.nspname = 'public'
      and case when c.relkind = 'S' then has_sequence_privilege('anon', c.oid, 'USAGE,SELECT,UPDATE') end),
  null,
  'anon no usa ninguna secuencia de public'
);

-- Las políticas RLS llaman a estas funciones como `authenticated`: quitarle
-- EXECUTE rompería todo el acceso.
select ok(
  has_function_privilege('authenticated', 'public.is_staff()', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.current_client_id()', 'EXECUTE'),
  'authenticated conserva EXECUTE sobre las funciones de las políticas'
);

-- Objetos nuevos, creados como los crea una migración: los privilegios por
-- omisión no deben dárselos a anon.
create function public.sonda_privilegios() returns int language sql as 'select 1';
create sequence public.sonda_privilegios_seq;

select ok(
  not has_function_privilege('anon', 'public.sonda_privilegios()', 'EXECUTE'),
  'una función nueva en public no queda ejecutable por anon'
);
select ok(
  not has_sequence_privilege('anon', 'public.sonda_privilegios_seq', 'USAGE,SELECT,UPDATE'),
  'una secuencia nueva en public no queda usable por anon'
);

select * from finish();
rollback;
