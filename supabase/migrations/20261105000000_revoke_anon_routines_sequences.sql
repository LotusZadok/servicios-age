-- anon conservaba EXECUTE sobre las funciones de public y todo sobre las
-- secuencias. La migración 2 se lo dio a anon junto con authenticated y
-- service_role, y la 3 sólo le revocó las tablas. Además, Postgres da EXECUTE a
-- PUBLIC sobre toda función nueva, y anon lo hereda por ahí.
--
-- Efecto visible antes de esta migración: con la llave anónima,
-- POST /rest/v1/rpc/is_admin respondía 200 (false), igual que is_staff (false)
-- y current_client_id (null). No filtraban datos, pero anon no tiene por qué
-- alcanzar ninguna función.
--
-- Ninguna función necesita a anon: todas las políticas son `to authenticated`,
-- y anon no tiene privilegios sobre ninguna tabla, así que nunca evalúa una
-- política. authenticated y service_role conservan EXECUTE.

revoke execute on all functions in schema public from anon, public;
revoke all on all sequences in schema public from anon;

-- Lo mismo para lo que creen migraciones futuras (las corre el rol postgres).
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
-- El EXECUTE de PUBLIC es un privilegio por omisión global, no del esquema:
-- sólo se puede quitar sin `in schema`. Afecta a las funciones que postgres
-- cree en cualquier esquema; este proyecto sólo crea en public.
alter default privileges for role postgres
  revoke execute on functions from public;
