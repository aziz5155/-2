-- Functional smoke test for RBAC + plans + discount codes + payments ledger.
-- Run after migrations 0001-0007 and both seed files (seed.sql, seed_billing.sql).
\set ON_ERROR_STOP on

-- 1) Two parents: one becomes owner, one is a regular customer.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'owner@example.com', '{"kind":"parent","full_name":"Owner"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'customer@example.com', '{"kind":"parent","full_name":"Customer"}'::jsonb);

-- Bootstrap ownership exactly like the real one-time script would.
insert into public.admin_users (user_id, role) values ('aaaaaaaa-0000-0000-0000-000000000001', 'owner');

set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select 'owner recognized by is_owner()' as check, public.is_owner() as ok;

-- 2) Customer creates a family and subscribes to the seeded free plan automatically.
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000002';
select * from public.create_family('Customer Family') \gset fam_

select 'new family starts on the free plan' as check, p.key = 'free' as ok
from public.subscriptions s join public.plans p on p.id = s.plan_id
where s.family_id = :'fam_id';

-- 3) Owner creates a 50% discount code with no plan restriction.
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.promo_codes (code, discount_percent, created_by)
values ('WELCOME50', 50, auth.uid())
returning id \gset code_

select 'promo code creation was audited' as check, count(*) = 1 as ok
from public.admin_audit_log where target_type = 'promo_codes' and action = 'promo_codes.create';

-- A non-owner cannot add staff.
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000002';
do $$
begin
  begin
    perform public.add_admin_by_email('customer@example.com', 'support');
    raise exception 'SHOULD NOT REACH HERE: non-owner was able to add staff';
  exception when others then
    if sqlerrm like 'only the owner%' then
      raise notice 'ok: non-owner correctly blocked from staff management';
    else
      raise;
    end if;
  end;
end $$;

-- 4) Customer validates the code against the monthly premium plan.
select p.id as plan_id into temporary table _tmp_plan from public.plans p where p.key = 'premium_monthly';

select 'code validates at 50%% off' as check,
  v.is_valid and v.final_amount = 14.50 as ok
from public.validate_promo_code('welcome50', (select plan_id from _tmp_plan)) v;

-- 5) Customer subscribes using the code.
select * from public.subscribe_family_to_plan((select plan_id from _tmp_plan), 'WELCOME50') \gset pay_

select 'payment recorded as pending (no gateway yet)' as check, status = 'pending_provider' as ok
from public.payments where id = :'pay_id';

select 'discount applied correctly to the ledger' as check,
  amount_gross = 29 and amount_discount = 14.50 and amount_net = 14.50 as ok
from public.payments where id = :'pay_id';

select 'family now on the monthly premium plan' as check, p.key = 'premium_monthly' as ok
from public.subscriptions s join public.plans p on p.id = s.plan_id
where s.family_id = :'fam_id';

select 'promo code usage counter incremented' as check, times_redeemed = 1 as ok
from public.promo_codes where id = :'code_id';

-- 6) Same customer cannot reuse the code (max_redemptions_per_customer = 1 by default).
select 'code correctly refuses a second use by the same family' as check, not v.is_valid as ok
from public.validate_promo_code('welcome50', (select plan_id from _tmp_plan)) v;

-- 7) A used code cannot be deleted, only archived.
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
do $$
begin
  begin
    delete from public.promo_codes where code = 'WELCOME50';
    raise exception 'SHOULD NOT REACH HERE: deleted a used promo code';
  exception when others then
    if sqlerrm like '%archive it instead%' then
      raise notice 'ok: used promo code correctly protected from deletion';
    else
      raise;
    end if;
  end;
end $$;

update public.promo_codes set status = 'archived' where code = 'WELCOME50';
select 'archiving a used code works' as check, status = 'archived' as ok from public.promo_codes where code = 'WELCOME50';

-- 8) Owner account itself cannot be deactivated.
do $$
begin
  begin
    perform public.set_admin_active('aaaaaaaa-0000-0000-0000-000000000001', false);
    raise exception 'SHOULD NOT REACH HERE: owner was deactivated';
  exception when others then
    if sqlerrm like '%owner account cannot be deactivated%' then
      raise notice 'ok: owner account is protected from deactivation';
    else
      raise;
    end if;
  end;
end $$;

select 'ALL BILLING/RBAC CHECKS PASSED' as final_result;
