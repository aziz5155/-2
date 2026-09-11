-- ============================================================================
-- Plans (pricing/features the owner controls), discount codes, and a
-- payments ledger. No real payment gateway is wired yet — every payment row
-- is recorded with status 'pending_provider' until one is connected (see
-- docs/EXTERNAL_SERVICES.md). This still lets the full pricing/discount
-- flow be built and tested end to end now.
-- ============================================================================

create type billing_period as enum ('daily', 'weekly', 'monthly', 'yearly');
create type promo_status as enum ('active', 'paused', 'archived');
create type payment_status as enum ('pending_provider', 'succeeded', 'failed', 'refunded');

-- ----------------------------------------------------------------------------
-- plans — the owner's pricing/feature catalog
-- ----------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  tier subscription_plan not null, -- 'free' | 'premium'
  billing_period billing_period, -- null for the free tier
  price_amount numeric(10, 2) not null default 0 check (price_amount >= 0),
  price_currency text not null default 'SAR',
  trial_days int not null default 0 check (trial_days >= 0),
  max_children int, -- null = unlimited
  max_programs int,
  max_rewards int,
  features jsonb not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

create trigger trg_plans_audit
  after insert or update or delete on public.plans
  for each row execute function public.audit_table_change();

create or replace function public.billing_period_interval(p billing_period)
returns interval
language sql
immutable
as $$
  select case p
    when 'daily' then interval '1 day'
    when 'weekly' then interval '7 days'
    when 'monthly' then interval '1 month'
    when 'yearly' then interval '1 year'
    else interval '1 month'
  end;
$$;

-- ----------------------------------------------------------------------------
-- subscriptions gets a real plan reference alongside the existing cached tier
-- ----------------------------------------------------------------------------
alter table public.subscriptions add column plan_id uuid references public.plans (id);
alter table public.subscriptions add column current_period_start timestamptz;

-- ----------------------------------------------------------------------------
-- promo_codes
-- ----------------------------------------------------------------------------
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 100),
  starts_at timestamptz not null default now(),
  ends_at timestamptz, -- null = never expires
  applies_to_first_n_payments int check (applies_to_first_n_payments is null or applies_to_first_n_payments > 0),
  max_redemptions int check (max_redemptions is null or max_redemptions > 0),
  max_redemptions_per_customer int not null default 1 check (max_redemptions_per_customer > 0),
  times_redeemed int not null default 0,
  status promo_status not null default 'active',
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create trigger trg_promo_codes_updated_at
  before update on public.promo_codes
  for each row execute function public.set_updated_at();

create trigger trg_promo_codes_audit
  after insert or update or delete on public.promo_codes
  for each row execute function public.audit_table_change();

-- A code that has ever been redeemed can only be archived, never deleted,
-- so its history in promo_code_redemptions always stays meaningful.
create or replace function public.prevent_delete_used_promo_code()
returns trigger
language plpgsql
as $$
begin
  if old.times_redeemed > 0 then
    raise exception 'this code has been used — archive it instead of deleting it';
  end if;
  return old;
end;
$$;

create trigger trg_promo_codes_prevent_delete
  before delete on public.promo_codes
  for each row execute function public.prevent_delete_used_promo_code();

create table public.promo_code_plans (
  promo_code_id uuid not null references public.promo_codes (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  primary key (promo_code_id, plan_id)
);

-- No rows for a code in promo_code_plans means "applies to every plan".

create table public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes (id),
  family_id uuid not null references public.families (id),
  redeemed_by uuid references public.users (id),
  plan_id uuid not null references public.plans (id),
  payment_number int not null,
  original_amount numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null,
  final_amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

revoke insert, update, delete on public.promo_code_redemptions from authenticated;

create index idx_promo_redemptions_code on public.promo_code_redemptions (promo_code_id);
create index idx_promo_redemptions_family on public.promo_code_redemptions (family_id);

-- ----------------------------------------------------------------------------
-- payments — the ledger of what each family owes/paid. Real capture happens
-- once a gateway is connected; until then every row is 'pending_provider'.
-- ----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id),
  plan_id uuid not null references public.plans (id),
  promo_code_id uuid references public.promo_codes (id),
  payment_number int not null default 1,
  amount_gross numeric(10, 2) not null,
  amount_discount numeric(10, 2) not null default 0,
  amount_net numeric(10, 2) not null,
  currency text not null default 'SAR',
  status payment_status not null default 'pending_provider',
  provider text not null default 'none',
  provider_reference text,
  created_at timestamptz not null default now()
);

revoke insert, update, delete on public.payments from authenticated;

create index idx_payments_family on public.payments (family_id, created_at desc);
create index idx_payments_status on public.payments (status);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_code_plans enable row level security;
alter table public.promo_code_redemptions enable row level security;
alter table public.payments enable row level security;

-- plans: everyone can browse active plans; only admins see/manage inactive ones too.
create policy "plans_select" on public.plans
  for select using (is_active or public.is_admin());

create policy "plans_write_admin" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

-- promo_codes: admin-only visibility. Regular clients never see the catalog
-- of codes directly — they can only validate one by name via the RPC below.
create policy "promo_codes_admin_only" on public.promo_codes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "promo_code_plans_admin_only" on public.promo_code_plans
  for all using (public.is_admin()) with check (public.is_admin());

create policy "promo_code_redemptions_select" on public.promo_code_redemptions
  for select using (public.is_admin() or public.is_family_parent(family_id));

create policy "payments_select" on public.payments
  for select using (public.is_admin() or public.is_family_parent(family_id));

-- ----------------------------------------------------------------------------
-- Checkout RPCs
-- ----------------------------------------------------------------------------
create or replace function public.validate_promo_code(p_code text, p_plan_id uuid)
returns table (
  is_valid boolean,
  message text,
  discount_percent numeric,
  original_amount numeric,
  final_amount numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid;
  v_code public.promo_codes;
  v_plan public.plans;
  v_applies boolean;
  v_customer_redemptions int;
begin
  select family_id into v_family_id from public.family_members where user_id = auth.uid() limit 1;
  select * into v_plan from public.plans where id = p_plan_id and is_active;

  if v_plan is null then
    return query select false, 'الباقة غير متاحة', null::numeric, null::numeric, null::numeric;
    return;
  end if;

  if p_code is null or trim(p_code) = '' then
    return query select false, 'أدخل كود الخصم', null::numeric, v_plan.price_amount, v_plan.price_amount;
    return;
  end if;

  select * into v_code from public.promo_codes where upper(code) = upper(trim(p_code));

  if v_code is null or v_code.status <> 'active' then
    return query select false, 'الكود غير صالح', null::numeric, v_plan.price_amount, v_plan.price_amount;
    return;
  end if;

  if now() < v_code.starts_at or (v_code.ends_at is not null and now() > v_code.ends_at) then
    return query select false, 'انتهت صلاحية هذا الكود', null::numeric, v_plan.price_amount, v_plan.price_amount;
    return;
  end if;

  if v_code.max_redemptions is not null and v_code.times_redeemed >= v_code.max_redemptions then
    return query select false, 'تم استنفاد عدد مرات استخدام هذا الكود', null::numeric, v_plan.price_amount, v_plan.price_amount;
    return;
  end if;

  select exists(select 1 from public.promo_code_plans where promo_code_id = v_code.id) into v_applies;
  if v_applies and not exists (
    select 1 from public.promo_code_plans where promo_code_id = v_code.id and plan_id = p_plan_id
  ) then
    return query select false, 'هذا الكود لا يشمل هذه الباقة', null::numeric, v_plan.price_amount, v_plan.price_amount;
    return;
  end if;

  if v_family_id is not null then
    select count(*) into v_customer_redemptions
    from public.promo_code_redemptions
    where promo_code_id = v_code.id and family_id = v_family_id;

    if v_customer_redemptions >= v_code.max_redemptions_per_customer then
      return query select false, 'لقد استخدمت هذا الكود من قبل', null::numeric, v_plan.price_amount, v_plan.price_amount;
      return;
    end if;

    if v_code.applies_to_first_n_payments is not null and v_customer_redemptions >= v_code.applies_to_first_n_payments then
      return query select false, 'لا يمكن استخدام هذا الكود لعدد الدفعات هذا', null::numeric, v_plan.price_amount, v_plan.price_amount;
      return;
    end if;
  end if;

  return query select
    true,
    'الكود صالح',
    v_code.discount_percent,
    v_plan.price_amount,
    round(v_plan.price_amount * (1 - v_code.discount_percent / 100), 2);
end;
$$;

create or replace function public.subscribe_family_to_plan(p_plan_id uuid, p_code text default null)
returns public.payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid;
  v_plan public.plans;
  v_code public.promo_codes;
  v_check record;
  v_payment_number int;
  v_amount_discount numeric(10, 2) := 0;
  v_amount_net numeric(10, 2);
  v_payment public.payments;
begin
  select family_id into v_family_id from public.family_members where user_id = auth.uid() limit 1;
  if v_family_id is null or not public.is_family_parent(v_family_id) then
    raise exception 'not authorized';
  end if;

  select * into v_plan from public.plans where id = p_plan_id and is_active;
  if v_plan is null then
    raise exception 'plan not available';
  end if;

  select count(*) + 1 into v_payment_number from public.payments where family_id = v_family_id;
  v_amount_net := v_plan.price_amount;

  if p_code is not null and trim(p_code) <> '' then
    select * into v_check from public.validate_promo_code(p_code, p_plan_id);
    if not v_check.is_valid then
      raise exception '%', v_check.message;
    end if;
    select * into v_code from public.promo_codes where upper(code) = upper(trim(p_code));
    v_amount_discount := v_plan.price_amount - v_check.final_amount;
    v_amount_net := v_check.final_amount;
  end if;

  insert into public.payments (family_id, plan_id, promo_code_id, payment_number, amount_gross, amount_discount, amount_net, currency, status, provider)
  values (v_family_id, v_plan.id, v_code.id, v_payment_number, v_plan.price_amount, v_amount_discount, v_amount_net, v_plan.price_currency, 'pending_provider', 'none')
  returning * into v_payment;

  if v_code.id is not null then
    insert into public.promo_code_redemptions (promo_code_id, family_id, redeemed_by, plan_id, payment_number, original_amount, discount_amount, final_amount)
    values (v_code.id, v_family_id, auth.uid(), v_plan.id, v_payment_number, v_plan.price_amount, v_amount_discount, v_amount_net);

    update public.promo_codes set times_redeemed = times_redeemed + 1 where id = v_code.id;
  end if;

  update public.subscriptions
  set plan_id = v_plan.id,
      plan = v_plan.tier,
      status = 'active',
      provider = 'none',
      current_period_start = now(),
      current_period_end = now() + public.billing_period_interval(v_plan.billing_period)
  where family_id = v_family_id;

  insert into public.activity_events (family_id, actor_user_id, event_type, message_key, message_params)
  values (v_family_id, auth.uid(), 'subscription_updated', 'activity.subscriptionUpdated', jsonb_build_object('planName', v_plan.name));

  return v_payment;
end;
$$;

-- ----------------------------------------------------------------------------
-- Give every newly created family a subscription on the free plan from day
-- one (redefines the function from 0003_functions.sql; CREATE OR REPLACE is
-- safe to run again even though the earlier version is already live).
-- ----------------------------------------------------------------------------
create or replace function public.create_family(p_name text)
returns public.families
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family public.families;
  v_free_plan_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.families (name, family_code, created_by)
  values (trim(p_name), public.generate_family_code(), auth.uid())
  returning * into v_family;

  insert into public.family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), 'owner');

  select id into v_free_plan_id from public.plans where key = 'free';

  insert into public.subscriptions (family_id, plan, status, plan_id, current_period_start)
  values (v_family.id, 'free', 'active', v_free_plan_id, now());

  return v_family;
end;
$$;
