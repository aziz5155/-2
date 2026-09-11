-- ============================================================================
-- Default plans catalog. Prices are starting points — edit them anytime from
-- the owner dashboard (لوحة المالك → الباقات), no SQL needed after this.
-- Safe to re-run (upserts by key).
-- ============================================================================

insert into public.plans (key, name, tier, billing_period, price_amount, price_currency, trial_days, max_children, max_programs, max_rewards, sort_order) values
  ('free', 'الخطة المجانية', 'free', null, 0, 'SAR', 0, 2, 3, 6, 1),
  ('premium_daily', 'بريميوم — يومي', 'premium', 'daily', 3, 'SAR', 0, null, null, null, 2),
  ('premium_weekly', 'بريميوم — أسبوعي', 'premium', 'weekly', 15, 'SAR', 0, null, null, null, 3),
  ('premium_monthly', 'بريميوم — شهري', 'premium', 'monthly', 29, 'SAR', 7, null, null, null, 4),
  ('premium_yearly', 'بريميوم — سنوي', 'premium', 'yearly', 279, 'SAR', 7, null, null, null, 5)
on conflict (key) do update set
  name = excluded.name,
  tier = excluded.tier,
  billing_period = excluded.billing_period,
  sort_order = excluded.sort_order;

-- Give every existing family a subscription row pointing at the free plan,
-- for families created before this migration (create_family already does
-- this for new ones going forward — see the updated function below).
update public.subscriptions s
set plan_id = p.id
from public.plans p
where p.key = 'free' and s.plan_id is null;
