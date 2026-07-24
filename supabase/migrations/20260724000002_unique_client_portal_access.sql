-- A client may have at most one portal login.
--
-- Without this, two concurrent "Habilitar acceso al portal" submissions could each
-- pass the application-level "does access already exist?" check and create two
-- `cliente` profiles for the same client. That breaks offboarding: the archive
-- action looks up the linked profile with `.maybeSingle()`, which errors on more
-- than one row, so the portal login would silently NOT be disabled.
--
-- Partial index: only rows that actually reference a client are constrained, so
-- staff profiles (client_id is null) are unaffected.
create unique index profiles_client_id_unique
  on public.profiles (client_id)
  where client_id is not null;
