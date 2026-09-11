-- ============================================================================
-- SELECT and function EXECUTE on new tables already flow to `authenticated`
-- via the default privileges set in 0004_grants.sql. Row Level Security
-- policies restrict actual access (e.g. plans/promo_codes writes require
-- is_admin()) — these grants just make INSERT/UPDATE/DELETE reachable at
-- all for the roles RLS is meant to allow.
-- ============================================================================

grant insert, update, delete on public.plans to authenticated;
grant insert, update, delete on public.promo_codes to authenticated;
grant insert, update, delete on public.promo_code_plans to authenticated;
