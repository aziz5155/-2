-- ============================================================================
-- Analytics: a real event log (not UI counters) plus SECURITY DEFINER
-- aggregate functions for two audiences that are kept strictly separate at
-- the database level:
--   * owner/admin  (public.is_admin())      -> platform-wide, aggregated only
--   * family parent (public.is_family_parent()) -> that family's own data
-- No table here is ever readable directly by `authenticated`; every access
-- path is one of the functions below, each with its own authorization check.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Event log
-- ----------------------------------------------------------------------------
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.users (id) on delete set null,
  family_id uuid references public.families (id) on delete set null,
  child_id uuid references public.children (id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_analytics_events_type_time on public.analytics_events (event_type, created_at);
create index idx_analytics_events_family on public.analytics_events (family_id, created_at);
create index idx_analytics_events_user_time on public.analytics_events (user_id, created_at);

alter table public.analytics_events enable row level security;

create policy "analytics_events_select_admin" on public.analytics_events
  for select using (public.is_admin());

-- No direct client writes at all — every row comes from a trigger below or
-- from log_app_open() (the one thing the client itself calls).
revoke insert, update, delete on public.analytics_events from authenticated;

create or replace function public.log_analytics_event(
  p_event_type text,
  p_user_id uuid,
  p_family_id uuid,
  p_child_id uuid,
  p_metadata jsonb default '{}'
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.analytics_events (event_type, user_id, family_id, child_id, metadata)
  values (p_event_type, p_user_id, p_family_id, p_child_id, p_metadata);
$$;

-- Called once by the client after a session is confirmed (throttled to
-- roughly once per day per user on the client side) — this is what DAU/WAU/MAU
-- are computed from, since the database has no other way to know "someone
-- opened the app" without doing real work.
create or replace function public.log_app_open()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.log_analytics_event('app_opened', auth.uid(), null, null, '{}');
$$;

grant execute on function public.log_app_open() to authenticated;

-- ----------------------------------------------------------------------------
-- Triggers — fire on the real tables regardless of which client path wrote
-- the row, so this isn't just counting UI button presses.
-- ----------------------------------------------------------------------------

create or replace function public.analytics_on_user_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'parent' then
    perform public.log_analytics_event('signup', new.id, null, null, '{}');
  end if;
  return new;
end;
$$;

create trigger trg_analytics_signup
  after insert on public.users
  for each row execute function public.analytics_on_user_insert();

create or replace function public.analytics_on_family_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_analytics_event('family_created', new.created_by, new.id, null, '{}');
  return new;
end;
$$;

create trigger trg_analytics_family_created
  after insert on public.families
  for each row execute function public.analytics_on_family_insert();

create or replace function public.analytics_on_child_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_analytics_event('child_added', null, new.family_id, new.id, '{}');
  return new;
end;
$$;

create trigger trg_analytics_child_added
  after insert on public.children
  for each row execute function public.analytics_on_child_insert();

create or replace function public.analytics_on_task_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_analytics_event('task_created', new.created_by, new.family_id, null, '{}');
  return new;
end;
$$;

create trigger trg_analytics_task_created
  after insert on public.tasks
  for each row execute function public.analytics_on_task_insert();

create or replace function public.analytics_on_completion_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_child_id uuid;
  v_family_id uuid;
begin
  if new.status in ('approved', 'auto_approved')
     and (tg_op = 'INSERT' or old.status not in ('approved', 'auto_approved')) then
    select a.child_id, t.family_id into v_child_id, v_family_id
    from public.task_assignments a
    join public.tasks t on t.id = a.task_id
    where a.id = new.task_assignment_id;

    perform public.log_analytics_event('task_completed', null, v_family_id, v_child_id, '{}');
  end if;
  return new;
end;
$$;

create trigger trg_analytics_task_completed
  after insert or update on public.task_completions
  for each row execute function public.analytics_on_completion_change();

create or replace function public.analytics_on_point_transaction()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_analytics_event(
    case when new.amount >= 0 then 'points_granted' else 'points_spent' end,
    new.created_by, new.family_id, new.child_id,
    jsonb_build_object('amount', new.amount, 'source_type', new.source_type)
  );
  return new;
end;
$$;

create trigger trg_analytics_points
  after insert on public.point_transactions
  for each row execute function public.analytics_on_point_transaction();

create or replace function public.analytics_on_reward_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_analytics_event('reward_created', new.created_by, new.family_id, null, '{}');
  return new;
end;
$$;

create trigger trg_analytics_reward_created
  after insert on public.rewards
  for each row execute function public.analytics_on_reward_insert();

create or replace function public.analytics_on_redemption_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_analytics_event('reward_requested', null, new.family_id, new.child_id, '{}');
  elsif tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then
    perform public.log_analytics_event('reward_redeemed', null, new.family_id, new.child_id, '{}');
  end if;
  return new;
end;
$$;

create trigger trg_analytics_redemption
  after insert or update on public.reward_redemptions
  for each row execute function public.analytics_on_redemption_change();

create or replace function public.analytics_on_subscription_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.status = 'canceled' and old.status <> 'canceled' then
      perform public.log_analytics_event('subscription_canceled', null, new.family_id, null,
        jsonb_build_object('plan', new.plan));
    elsif new.plan = 'premium' and (old.plan is distinct from 'premium' or old.status <> 'active') and new.status = 'active' then
      perform public.log_analytics_event('subscription_upgraded', null, new.family_id, null,
        jsonb_build_object('from_plan', old.plan));
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_analytics_subscription
  after update on public.subscriptions
  for each row execute function public.analytics_on_subscription_change();

-- ----------------------------------------------------------------------------
-- Owner analytics — every function below requires is_admin() and returns
-- only aggregated counts, never a child's name or a family's private content.
-- ----------------------------------------------------------------------------

create or replace function public.owner_overview_stats(p_start timestamptz, p_end timestamptz)
returns table (
  total_users bigint,
  total_families bigint,
  total_children bigint,
  new_users bigint,
  new_families bigint,
  new_children bigint,
  avg_children_per_family numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.users where kind = 'parent'),
    (select count(*) from public.families),
    (select count(*) from public.children where is_active),
    (select count(*) from public.users where kind = 'parent' and created_at >= p_start and created_at < p_end),
    (select count(*) from public.families where created_at >= p_start and created_at < p_end),
    (select count(*) from public.children where created_at >= p_start and created_at < p_end),
    round(
      (select count(*) from public.children where is_active)::numeric
      / greatest((select count(*) from public.families), 1),
      2
    );
end;
$$;

create or replace function public.owner_engagement_stats()
returns table (dau bigint, wau bigint, mau bigint, dormant_accounts bigint)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(distinct user_id) from public.analytics_events where event_type = 'app_opened' and created_at >= now() - interval '1 day'),
    (select count(distinct user_id) from public.analytics_events where event_type = 'app_opened' and created_at >= now() - interval '7 days'),
    (select count(distinct user_id) from public.analytics_events where event_type = 'app_opened' and created_at >= now() - interval '30 days'),
    (select count(*) from public.users u
       where u.kind = 'parent' and u.created_at < now() - interval '30 days'
       and not exists (
         select 1 from public.analytics_events ae
         where ae.user_id = u.id and ae.event_type = 'app_opened' and ae.created_at >= now() - interval '30 days'
       ));
end;
$$;

-- Rolling 30-day retention: of the users active in the 30 days before that,
-- what share are still active in the last 30 days. A simple, honest
-- approximation — not a full per-cohort retention curve.
create or replace function public.owner_retention_stats()
returns table (previously_active bigint, still_active bigint, retention_rate numeric)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_prev bigint;
  v_still bigint;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select count(distinct user_id) into v_prev
  from public.analytics_events
  where event_type = 'app_opened' and created_at >= now() - interval '60 days' and created_at < now() - interval '30 days';

  select count(distinct a.user_id) into v_still
  from (
    select distinct user_id from public.analytics_events
    where event_type = 'app_opened' and created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'
  ) a
  where exists (
    select 1 from public.analytics_events b
    where b.user_id = a.user_id and b.event_type = 'app_opened' and b.created_at >= now() - interval '30 days'
  );

  return query select v_prev, v_still, case when v_prev = 0 then null else round(v_still::numeric / v_prev * 100, 1) end;
end;
$$;

create or replace function public.owner_task_stats(p_start timestamptz, p_end timestamptz)
returns table (tasks_created bigint, programs_created bigint, completions_recorded bigint, completions_approved bigint, completion_rate numeric)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_recorded bigint;
  v_approved bigint;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_recorded from public.task_completions where created_at >= p_start and created_at < p_end;
  select count(*) into v_approved from public.task_completions where created_at >= p_start and created_at < p_end and status in ('approved', 'auto_approved');

  return query
  select
    (select count(*) from public.tasks where created_at >= p_start and created_at < p_end),
    (select count(*) from public.programs where created_at >= p_start and created_at < p_end),
    v_recorded,
    v_approved,
    case when v_recorded = 0 then null else round(v_approved::numeric / v_recorded * 100, 1) end;
end;
$$;

create or replace function public.owner_points_stats(p_start timestamptz, p_end timestamptz)
returns table (points_granted bigint, points_spent bigint)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    coalesce((select sum(amount) from public.point_transactions where amount > 0 and created_at >= p_start and created_at < p_end), 0),
    coalesce((select sum(-amount) from public.point_transactions where amount < 0 and created_at >= p_start and created_at < p_end), 0);
end;
$$;

create or replace function public.owner_rewards_stats(p_start timestamptz, p_end timestamptz)
returns table (rewards_created bigint, redemptions_requested bigint, redemptions_approved bigint)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.rewards where created_at >= p_start and created_at < p_end),
    (select count(*) from public.reward_redemptions where requested_at >= p_start and requested_at < p_end),
    (select count(*) from public.reward_redemptions where decided_at >= p_start and decided_at < p_end and status = 'approved');
end;
$$;

-- Global catalog content (program templates) is not private family data, so
-- this is safe to rank by name — unlike custom reward names, which stay
-- aggregate-only (see owner_rewards_stats above).
create or replace function public.owner_top_templates(p_start timestamptz, p_end timestamptz, p_limit int default 5)
returns table (template_name text, usage_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select pt.name, count(*)
  from public.programs p
  join public.program_templates pt on pt.key = p.template_key
  where p.created_at >= p_start and p.created_at < p_end
  group by pt.name
  order by count(*) desc
  limit p_limit;
end;
$$;

create or replace function public.owner_feature_usage(p_start timestamptz, p_end timestamptz)
returns table (event_type text, usage_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select ae.event_type, count(*)
  from public.analytics_events ae
  where ae.created_at >= p_start and ae.created_at < p_end
  group by ae.event_type
  order by count(*) desc;
end;
$$;

create or replace function public.owner_funnel_stats(p_start timestamptz, p_end timestamptz)
returns table (step text, step_order int, account_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with cohort as (
    select u.id as user_id, u.created_at
    from public.users u
    where u.kind = 'parent' and u.created_at >= p_start and u.created_at < p_end
  ),
  fam as (
    select c.user_id, c.created_at, fm.family_id
    from cohort c
    join public.family_members fm on fm.user_id = c.user_id
  )
  select 'signed_up'::text, 1, (select count(*) from cohort)
  union all
  select 'created_family', 2, (select count(distinct user_id) from fam)
  union all
  select 'added_child', 3, (select count(distinct f.user_id) from fam f where exists (select 1 from public.children ch where ch.family_id = f.family_id))
  union all
  select 'created_first_task', 4, (select count(distinct f.user_id) from fam f where exists (select 1 from public.tasks t where t.family_id = f.family_id))
  union all
  select 'granted_first_points', 5, (select count(distinct f.user_id) from fam f where exists (select 1 from public.point_transactions pt where pt.family_id = f.family_id and pt.amount > 0))
  union all
  select 'created_first_reward', 6, (select count(distinct f.user_id) from fam f where exists (select 1 from public.rewards r where r.family_id = f.family_id))
  union all
  select 'returned_after_signup', 7, (
    select count(distinct c.user_id) from cohort c
    where exists (
      select 1 from public.analytics_events ae
      where ae.user_id = c.user_id and ae.event_type = 'app_opened' and ae.created_at > c.created_at + interval '24 hours'
    )
  )
  order by 2;
end;
$$;

create or replace function public.owner_subscription_stats(p_start timestamptz, p_end timestamptz)
returns table (
  free_count bigint,
  premium_count bigint,
  new_premium_in_period bigint,
  canceled_in_period bigint,
  churn_rate numeric,
  revenue_available boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_premium_now bigint;
  v_canceled bigint;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_premium_now from public.subscriptions where plan = 'premium' and status = 'active';
  select count(*) into v_canceled from public.analytics_events where event_type = 'subscription_canceled' and created_at >= p_start and created_at < p_end;

  return query
  select
    (select count(*) from public.subscriptions where plan = 'free'),
    v_premium_now,
    (select count(*) from public.analytics_events where event_type = 'subscription_upgraded' and created_at >= p_start and created_at < p_end),
    v_canceled,
    case when (v_premium_now + v_canceled) = 0 then null else round(v_canceled::numeric / (v_premium_now + v_canceled) * 100, 1) end,
    false; -- no payment provider connected yet — the app never has real revenue data to show.
end;
$$;

-- ----------------------------------------------------------------------------
-- Parent-facing family & child analytics — gated by is_family_parent(),
-- scoped to exactly one family. No cross-family or platform-wide access.
-- ----------------------------------------------------------------------------

create or replace function public.family_insights_summary(p_family_id uuid, p_start timestamptz, p_end timestamptz)
returns table (
  completed_count bigint,
  points_earned bigint,
  points_spent bigint,
  rewards_redeemed bigint,
  active_days bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_family_parent(p_family_id) then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.task_completions tc
       join public.task_assignments a on a.id = tc.task_assignment_id
       join public.tasks t on t.id = a.task_id
       where t.family_id = p_family_id and tc.status in ('approved', 'auto_approved')
       and tc.decided_at >= p_start and tc.decided_at < p_end),
    coalesce((select sum(amount) from public.point_transactions where family_id = p_family_id and amount > 0 and created_at >= p_start and created_at < p_end), 0),
    coalesce((select sum(-amount) from public.point_transactions where family_id = p_family_id and amount < 0 and created_at >= p_start and created_at < p_end), 0),
    (select count(*) from public.reward_redemptions where family_id = p_family_id and status = 'approved' and decided_at >= p_start and decided_at < p_end),
    (select count(distinct tc.occurrence_date) from public.task_completions tc
       join public.task_assignments a on a.id = tc.task_assignment_id
       join public.tasks t on t.id = a.task_id
       where t.family_id = p_family_id and tc.status in ('approved', 'auto_approved')
       and tc.decided_at >= p_start and tc.decided_at < p_end);
end;
$$;

create or replace function public.child_analytics(p_child_id uuid, p_start timestamptz, p_end timestamptz)
returns table (
  completions_recorded bigint,
  completions_approved bigint,
  completion_rate numeric,
  points_earned bigint,
  points_spent bigint,
  rewards_redeemed bigint,
  most_missed_tasks jsonb,
  most_consistent_program jsonb,
  points_by_reason jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_family_id uuid;
  v_recorded bigint;
  v_approved bigint;
begin
  select family_id into v_family_id from public.children where id = p_child_id;
  if v_family_id is null or not public.is_family_parent(v_family_id) then
    raise exception 'not authorized';
  end if;

  select count(*) into v_recorded from public.task_completions tc
    join public.task_assignments a on a.id = tc.task_assignment_id
    where a.child_id = p_child_id and tc.created_at >= p_start and tc.created_at < p_end;
  select count(*) into v_approved from public.task_completions tc
    join public.task_assignments a on a.id = tc.task_assignment_id
    where a.child_id = p_child_id and tc.status in ('approved', 'auto_approved')
    and tc.created_at >= p_start and tc.created_at < p_end;

  return query
  select
    v_recorded,
    v_approved,
    case when v_recorded = 0 then null else round(v_approved::numeric / v_recorded * 100, 1) end,
    coalesce((select sum(amount) from public.point_transactions where child_id = p_child_id and amount > 0 and created_at >= p_start and created_at < p_end), 0),
    coalesce((select sum(-amount) from public.point_transactions where child_id = p_child_id and amount < 0 and created_at >= p_start and created_at < p_end), 0),
    (select count(*) from public.reward_redemptions where child_id = p_child_id and status = 'approved' and decided_at >= p_start and decided_at < p_end),
    (
      select coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb) from (
        select t.title, count(*) filter (where tc.status = 'rejected') as miss_count
        from public.task_completions tc
        join public.task_assignments a on a.id = tc.task_assignment_id
        join public.tasks t on t.id = a.task_id
        where a.child_id = p_child_id and tc.created_at >= p_start and tc.created_at < p_end
        group by t.title
        having count(*) filter (where tc.status = 'rejected') >= 2
        order by miss_count desc
        limit 5
      ) x
    ),
    (
      select row_to_json(x)::jsonb from (
        select pr.name, count(*) as completed_count
        from public.task_completions tc
        join public.task_assignments a on a.id = tc.task_assignment_id
        join public.tasks t on t.id = a.task_id
        join public.program_tasks pgt on pgt.task_id = t.id
        join public.programs pr on pr.id = pgt.program_id
        where a.child_id = p_child_id and tc.status in ('approved', 'auto_approved')
        and tc.created_at >= p_start and tc.created_at < p_end
        group by pr.name
        order by completed_count desc
        limit 1
      ) x
    ),
    (
      select coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb) from (
        select reason, sum(amount) as total
        from public.point_transactions
        where child_id = p_child_id and amount > 0 and created_at >= p_start and created_at < p_end
        group by reason
        order by total desc
        limit 5
      ) x
    );
end;
$$;
