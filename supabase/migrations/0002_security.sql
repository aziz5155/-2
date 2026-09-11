-- ============================================================================
-- Authorization helpers + Row Level Security policies.
-- Every table is protected server-side; the client can never see or touch
-- data outside its own family, and privileged mutations only happen through
-- SECURITY DEFINER functions (see 0003_functions.sql).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they bypass RLS on the tables they
-- inspect — this is what prevents policy recursion).
-- ----------------------------------------------------------------------------
create or replace function public.is_family_parent(fam uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fam and user_id = auth.uid()
  );
$$;

create or replace function public.is_family_child(fam uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.children
    where family_id = fam and user_id = auth.uid()
  );
$$;

create or replace function public.current_child_id()
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select id from public.children where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_family_member(fam uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select public.is_family_parent(fam) or public.is_family_child(fam);
$$;

create or replace function public.task_family_id(t_id uuid)
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select family_id from public.tasks where id = t_id;
$$;

create or replace function public.assignment_family_id(a_id uuid)
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select t.family_id
  from public.task_assignments a
  join public.tasks t on t.id = a.task_id
  where a.id = a_id;
$$;

create or replace function public.assignment_child_id(a_id uuid)
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select child_id from public.task_assignments where id = a_id;
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.streaks enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_completions enable row level security;
alter table public.programs enable row level security;
alter table public.program_tasks enable row level security;
alter table public.point_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.goals enable row level security;
alter table public.achievements enable row level security;
alter table public.child_achievements enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;
alter table public.program_templates enable row level security;
alter table public.program_template_tasks enable row level security;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- families
-- ----------------------------------------------------------------------------
create policy "families_select_member" on public.families
  for select using (public.is_family_member(id));

-- insert/update happen only via SECURITY DEFINER RPCs (create_family etc).

-- ----------------------------------------------------------------------------
-- family_members
-- ----------------------------------------------------------------------------
create policy "family_members_select" on public.family_members
  for select using (public.is_family_member(family_id));

create policy "family_members_insert_by_parent" on public.family_members
  for insert with check (public.is_family_parent(family_id));

create policy "family_members_delete_by_parent" on public.family_members
  for delete using (public.is_family_parent(family_id));

-- ----------------------------------------------------------------------------
-- children
-- ----------------------------------------------------------------------------
create policy "children_select" on public.children
  for select using (public.is_family_parent(family_id) or user_id = auth.uid());

create policy "children_insert_by_parent" on public.children
  for insert with check (public.is_family_parent(family_id));

create policy "children_update_by_parent" on public.children
  for update using (public.is_family_parent(family_id));

create policy "children_delete_by_parent" on public.children
  for delete using (public.is_family_parent(family_id));

-- ----------------------------------------------------------------------------
-- streaks
-- ----------------------------------------------------------------------------
create policy "streaks_select" on public.streaks
  for select using (public.is_family_parent(family_id) or child_id = public.current_child_id());

-- writes only via functions (revoke below)
revoke insert, update, delete on public.streaks from authenticated;

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
create policy "tasks_select" on public.tasks
  for select using (
    public.is_family_parent(family_id)
    or exists (
      select 1 from public.task_assignments a
      where a.task_id = tasks.id and a.child_id = public.current_child_id()
    )
  );

create policy "tasks_insert_by_parent" on public.tasks
  for insert with check (public.is_family_parent(family_id));

create policy "tasks_update_by_parent" on public.tasks
  for update using (public.is_family_parent(family_id));

create policy "tasks_delete_by_parent" on public.tasks
  for delete using (public.is_family_parent(family_id));

-- ----------------------------------------------------------------------------
-- task_assignments
-- ----------------------------------------------------------------------------
create policy "task_assignments_select" on public.task_assignments
  for select using (
    public.is_family_parent(public.task_family_id(task_id))
    or child_id = public.current_child_id()
  );

create policy "task_assignments_insert_by_parent" on public.task_assignments
  for insert with check (public.is_family_parent(public.task_family_id(task_id)));

create policy "task_assignments_delete_by_parent" on public.task_assignments
  for delete using (public.is_family_parent(public.task_family_id(task_id)));

-- ----------------------------------------------------------------------------
-- task_completions (select only — mutations via RPC)
-- ----------------------------------------------------------------------------
create policy "task_completions_select" on public.task_completions
  for select using (
    public.is_family_parent(public.assignment_family_id(task_assignment_id))
    or public.assignment_child_id(task_assignment_id) = public.current_child_id()
  );

-- ----------------------------------------------------------------------------
-- programs & program_tasks
-- ----------------------------------------------------------------------------
create policy "programs_select" on public.programs
  for select using (public.is_family_member(family_id));

create policy "programs_insert_by_parent" on public.programs
  for insert with check (public.is_family_parent(family_id));

create policy "programs_update_by_parent" on public.programs
  for update using (public.is_family_parent(family_id));

create policy "programs_delete_by_parent" on public.programs
  for delete using (public.is_family_parent(family_id));

create policy "program_tasks_select" on public.program_tasks
  for select using (
    exists (select 1 from public.programs p where p.id = program_id and public.is_family_member(p.family_id))
  );

create policy "program_tasks_insert_by_parent" on public.program_tasks
  for insert with check (
    exists (select 1 from public.programs p where p.id = program_id and public.is_family_parent(p.family_id))
  );

create policy "program_tasks_delete_by_parent" on public.program_tasks
  for delete using (
    exists (select 1 from public.programs p where p.id = program_id and public.is_family_parent(p.family_id))
  );

-- ----------------------------------------------------------------------------
-- point_transactions (select only — inserts via RPC)
-- ----------------------------------------------------------------------------
create policy "point_tx_select" on public.point_transactions
  for select using (
    public.is_family_parent(family_id) or child_id = public.current_child_id()
  );

-- ----------------------------------------------------------------------------
-- rewards
-- ----------------------------------------------------------------------------
create policy "rewards_select" on public.rewards
  for select using (public.is_family_member(family_id));

create policy "rewards_insert_by_parent" on public.rewards
  for insert with check (public.is_family_parent(family_id));

create policy "rewards_update_by_parent" on public.rewards
  for update using (public.is_family_parent(family_id));

create policy "rewards_delete_by_parent" on public.rewards
  for delete using (public.is_family_parent(family_id));

-- ----------------------------------------------------------------------------
-- reward_redemptions (select only — inserts/updates via RPC)
-- ----------------------------------------------------------------------------
create policy "redemptions_select" on public.reward_redemptions
  for select using (
    public.is_family_parent(family_id) or child_id = public.current_child_id()
  );

-- ----------------------------------------------------------------------------
-- goals
-- ----------------------------------------------------------------------------
create policy "goals_select" on public.goals
  for select using (
    public.is_family_parent(family_id) or child_id = public.current_child_id()
  );

create policy "goals_insert" on public.goals
  for insert with check (
    public.is_family_parent(family_id) or child_id = public.current_child_id()
  );

create policy "goals_update" on public.goals
  for update using (
    public.is_family_parent(family_id) or child_id = public.current_child_id()
  );

create policy "goals_delete" on public.goals
  for delete using (
    public.is_family_parent(family_id) or child_id = public.current_child_id()
  );

-- ----------------------------------------------------------------------------
-- achievements (public read-only catalog)
-- ----------------------------------------------------------------------------
create policy "achievements_select_all" on public.achievements
  for select using (true);

create policy "child_achievements_select" on public.child_achievements
  for select using (
    exists (
      select 1 from public.children c
      where c.id = child_id and (public.is_family_parent(c.family_id) or c.user_id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- challenges & challenge_members
-- ----------------------------------------------------------------------------
create policy "challenges_select" on public.challenges
  for select using (public.is_family_member(family_id));

create policy "challenges_insert_by_parent" on public.challenges
  for insert with check (public.is_family_parent(family_id));

create policy "challenges_update_by_parent" on public.challenges
  for update using (public.is_family_parent(family_id));

create policy "challenges_delete_by_parent" on public.challenges
  for delete using (public.is_family_parent(family_id));

create policy "challenge_members_select" on public.challenge_members
  for select using (
    exists (select 1 from public.challenges ch where ch.id = challenge_id and public.is_family_member(ch.family_id))
  );

create policy "challenge_members_insert" on public.challenge_members
  for insert with check (
    child_id = public.current_child_id()
    or exists (select 1 from public.challenges ch where ch.id = challenge_id and public.is_family_parent(ch.family_id))
  );

create policy "challenge_members_delete" on public.challenge_members
  for delete using (
    exists (select 1 from public.challenges ch where ch.id = challenge_id and public.is_family_parent(ch.family_id))
  );

-- ----------------------------------------------------------------------------
-- activity_events (select only — inserts via RPC/triggers)
-- ----------------------------------------------------------------------------
create policy "activity_events_select" on public.activity_events
  for select using (public.is_family_member(family_id));

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create policy "notifications_select_own" on public.notifications
  for select using (recipient_user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (recipient_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- subscriptions (select only — writes via service role / RPC)
-- ----------------------------------------------------------------------------
create policy "subscriptions_select" on public.subscriptions
  for select using (public.is_family_member(family_id));

-- ----------------------------------------------------------------------------
-- program_templates / program_template_tasks (public read-only catalog)
-- ----------------------------------------------------------------------------
create policy "program_templates_select_all" on public.program_templates
  for select using (true);

create policy "program_template_tasks_select_all" on public.program_template_tasks
  for select using (true);

-- ----------------------------------------------------------------------------
-- Auth wiring: create a public.users row whenever a new auth user signs up.
-- Parent signups pass full_name/kind via user_metadata; child accounts are
-- provisioned by the create_child RPC which also inserts this row directly,
-- so this trigger only needs to handle the "no row yet" case.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.users (id, kind, full_name, email, locale)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'kind')::user_kind, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'locale', 'ar')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
