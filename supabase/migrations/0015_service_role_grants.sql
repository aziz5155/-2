-- ============================================================================
-- The create-child Edge Function inserts into public.children using the
-- service role key (it must — creating another user's auth account and
-- profile row is a privileged operation that can never run as the calling
-- parent). Supabase normally provisions service_role with full privileges
-- on every table automatically, but that can drift on a project that has
-- been through many manual SQL-editor migrations. Make it explicit and
-- idempotent so a service-role-only write never hits
-- "permission denied for table X" again, on children or any other table.
-- RLS is unaffected: service_role already bypasses RLS on its own, this
-- only concerns the separate GRANT layer Postgres checks first.
-- ============================================================================

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant all privileges on functions to service_role;
