-- ============================================================================
-- ONE-TIME script: grants the owner role to a specific, already-existing
-- account. Run this manually in the Supabase SQL Editor exactly once, AFTER
-- creating the account itself in the Dashboard (Authentication → Users →
-- Add user). It is never run automatically and ownership is never granted
-- by matching an email at signup — this is the one deliberate, auditable
-- action that creates an owner.
--
-- Safe to re-run: it just re-confirms the same person as owner.
-- ============================================================================

insert into public.admin_users (user_id, role)
select id, 'owner'
from public.users
where email = '797aaa797@gmail.com'
on conflict (user_id) do update set role = 'owner', is_active = true, updated_at = now();

-- Confirms it worked — should return exactly one row with role = 'owner'.
select u.email, a.role, a.is_active
from public.admin_users a
join public.users u on u.id = a.user_id
where u.email = '797aaa797@gmail.com';
