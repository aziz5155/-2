-- ============================================================================
-- Lets an owner/admin see every account (parents included), not just the
-- ones who already created a family — needed for the "Customers" list to
-- show signups that haven't finished onboarding yet. Additive: the existing
-- "see your own row" policy for regular users is untouched (RLS SELECT
-- policies are OR'd together).
-- ============================================================================

create policy "users_select_admin" on public.users
  for select using (public.is_admin());
