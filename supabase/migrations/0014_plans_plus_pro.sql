-- ============================================================================
-- Real Plus/Pro tiers: two paid plans, each sold on a daily/monthly/yearly
-- cycle the customer picks — not one "premium" tier duplicated per cycle.
-- Pro is meant to be the superset of Plus; there is no separate feature
-- gate between them yet, so anywhere the code only cared about "free vs
-- paid" now treats plus and pro the same way (coalesce(plan,'free') <>
-- 'free'). The old premium_* rows are deactivated, not deleted, since
-- payments/promo_code_plans may still reference them.
-- ============================================================================

update public.plans set is_active = false where key in ('premium_daily', 'premium_weekly', 'premium_monthly', 'premium_yearly');

insert into public.plans (key, name, tier, billing_period, price_amount, price_currency, trial_days, max_children, max_programs, max_rewards, sort_order) values
  ('plus_daily', 'Plus — يومي', 'plus', 'daily', 4, 'SAR', 0, null, null, null, 10),
  ('plus_monthly', 'Plus — شهري', 'plus', 'monthly', 29, 'SAR', 7, null, null, null, 11),
  ('plus_yearly', 'Plus — سنوي', 'plus', 'yearly', 279, 'SAR', 7, null, null, null, 12),
  ('pro_daily', 'Pro — يومي', 'pro', 'daily', 7, 'SAR', 0, null, null, null, 20),
  ('pro_monthly', 'Pro — شهري', 'pro', 'monthly', 49, 'SAR', 7, null, null, null, 21),
  ('pro_yearly', 'Pro — سنوي', 'pro', 'yearly', 449, 'SAR', 7, null, null, null, 22)
on conflict (key) do update set
  name = excluded.name,
  tier = excluded.tier,
  billing_period = excluded.billing_period,
  sort_order = excluded.sort_order,
  is_active = true;

-- "Premium" gating on program templates now means "any paid tier".
create or replace function public.create_program_from_template(p_family_id uuid, p_template_id uuid)
returns public.programs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_template public.program_templates;
  v_plan subscription_plan;
  v_program public.programs;
  v_tt record;
  v_task_id uuid;
begin
  if not public.is_family_parent(p_family_id) then
    raise exception 'not authorized';
  end if;

  select * into v_template from public.program_templates where id = p_template_id;
  if v_template is null then
    raise exception 'template not found';
  end if;

  select plan into v_plan from public.subscriptions where family_id = p_family_id;
  if v_template.is_premium and coalesce(v_plan, 'free') = 'free' then
    raise exception 'this template requires a paid plan';
  end if;

  insert into public.programs (family_id, created_by, name, description, icon, template_key)
  values (p_family_id, auth.uid(), v_template.name, v_template.description, v_template.icon, v_template.key)
  returning * into v_program;

  for v_tt in select * from public.program_template_tasks where template_id = p_template_id order by sort_order loop
    insert into public.tasks (family_id, created_by, title, description, icon, category, points, recurrence_type, time_of_day, approval_mode)
    values (p_family_id, auth.uid(), v_tt.title, v_tt.description, v_tt.icon, v_tt.category, v_tt.points, 'daily', v_tt.time_of_day, 'manual')
    returning id into v_task_id;

    insert into public.program_tasks (program_id, task_id, sort_order)
    values (v_program.id, v_task_id, v_tt.sort_order);
  end loop;

  return v_program;
end;
$$;

-- The analytics "upgrade" event now fires for either paid tier, not just
-- the old single 'premium' value.
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
    elsif new.plan <> 'free' and (old.plan is distinct from new.plan or old.status <> 'active') and new.status = 'active' then
      perform public.log_analytics_event('subscription_upgraded', null, new.family_id, null,
        jsonb_build_object('from_plan', old.plan, 'to_plan', new.plan));
    end if;
  end if;
  return new;
end;
$$;

-- Owner subscription stats now break Plus and Pro out separately instead of
-- lumping every paid family into one "premium" bucket. The return columns
-- changed shape, and Postgres won't let CREATE OR REPLACE alter a
-- function's OUT parameters — it has to be dropped first.
drop function if exists public.owner_subscription_stats(timestamptz, timestamptz);

create function public.owner_subscription_stats(p_start timestamptz, p_end timestamptz)
returns table (
  free_count bigint,
  plus_count bigint,
  pro_count bigint,
  new_paid_in_period bigint,
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
  v_paid_now bigint;
  v_canceled bigint;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_paid_now from public.subscriptions where plan <> 'free' and status = 'active';
  select count(*) into v_canceled from public.analytics_events where event_type = 'subscription_canceled' and created_at >= p_start and created_at < p_end;

  return query
  select
    (select count(*) from public.subscriptions where plan = 'free'),
    (select count(*) from public.subscriptions where plan = 'plus' and status = 'active'),
    (select count(*) from public.subscriptions where plan = 'pro' and status = 'active'),
    (select count(*) from public.analytics_events where event_type = 'subscription_upgraded' and created_at >= p_start and created_at < p_end),
    v_canceled,
    case when (v_paid_now + v_canceled) = 0 then null else round(v_canceled::numeric / (v_paid_now + v_canceled) * 100, 1) end,
    false; -- no payment provider connected yet — the app never has real revenue data to show.
end;
$$;
