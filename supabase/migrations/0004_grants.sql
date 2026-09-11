-- ============================================================================
-- Table & function privileges for the `authenticated` role.
-- Baseline: SELECT is granted broadly (RLS still filters every row).
-- Direct INSERT/UPDATE/DELETE is granted ONLY on tables that are safe for a
-- client to touch directly; anything ledger-related (points, task
-- completions, redemptions, achievements, streaks, activity feed,
-- notifications insert, subscriptions, families) is reachable exclusively
-- through the SECURITY DEFINER functions in 0003_functions.sql, which run
-- with the function owner's privileges regardless of these grants.
-- ============================================================================

grant usage on schema public to authenticated, anon;

grant select on all tables in schema public to authenticated;

grant insert, update, delete on public.family_members to authenticated;
grant insert, delete on public.children to authenticated; -- update is column-limited in 0001
grant insert, update, delete on public.tasks to authenticated;
grant insert, delete on public.task_assignments to authenticated;
grant insert, update, delete on public.programs to authenticated;
grant insert, delete on public.program_tasks to authenticated;
grant insert, update, delete on public.rewards to authenticated;
grant insert, update, delete on public.goals to authenticated;
grant insert, update, delete on public.challenges to authenticated;
grant insert, delete on public.challenge_members to authenticated;
grant update (full_name, avatar_url, locale) on public.users to authenticated;

grant execute on all functions in schema public to authenticated;

alter default privileges in schema public grant select on tables to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
