-- ============================================================================
-- Lets an owner/admin grant any family a plan directly — permanently or
-- until a given date — without that family going through checkout. Used
-- for support gestures, manual promos, etc. p_expires_at = null means the
-- grant never expires on its own.
-- ============================================================================

create or replace function public.admin_grant_subscription(
  p_family_id uuid,
  p_plan_id uuid,
  p_expires_at timestamptz default null
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan public.plans;
  v_sub public.subscriptions;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into v_plan from public.plans where id = p_plan_id;
  if v_plan is null then
    raise exception 'plan not found';
  end if;

  update public.subscriptions
  set plan_id = v_plan.id,
      plan = v_plan.tier,
      status = 'active',
      provider = 'admin_grant',
      current_period_start = now(),
      current_period_end = p_expires_at
  where family_id = p_family_id
  returning * into v_sub;

  if v_sub is null then
    raise exception 'family not found';
  end if;

  insert into public.activity_events (family_id, actor_user_id, event_type, message_key, message_params)
  values (p_family_id, auth.uid(), 'subscription_updated', 'activity.subscriptionUpdated', jsonb_build_object('planName', v_plan.name));

  return v_sub;
end;
$$;

-- subscriptions is now admin-writable (via the function above) — give it the
-- same audit trail as the other admin-writable billing tables.
create trigger trg_subscriptions_audit
  after insert or update or delete on public.subscriptions
  for each row execute function public.audit_table_change();
