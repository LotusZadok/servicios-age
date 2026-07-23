-- Tighten the broad grants from 20260723000001 to least privilege.
-- RLS is the real row-level gate; these grants only decide which SQL verbs a
-- role may attempt at all. No policy targets `anon`, so it needs nothing.
-- `authenticated` only ever runs DML (select/insert/update/delete), never
-- owner-level operations (truncate/references/trigger). `service_role` keeps
-- full access (it bypasses RLS by design).

-- anon: revoke everything (current and future objects).
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- authenticated: reset to just DML.
revoke all on all tables in schema public from authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
