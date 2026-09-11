-- Functional smoke test for the RPC layer, run against the migrated
-- familytest database. Exercises: family creation, child provisioning
-- (normally done by the create-child edge function), task assignment,
-- completion + auto-approval, manual approval flow, points ledger,
-- reward redemption, and achievement unlocking.
\set ON_ERROR_STOP on

-- 1) Parent signs up
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'parent@example.com', '{"kind":"parent","full_name":"Parent One"}'::jsonb);

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select 'users row created by trigger' as check, count(*) = 1 as ok from public.users where id = auth.uid();

-- 2) Create family
select * from public.create_family('Test Family') \gset fam_
select 'family created' as check, :'fam_name' = 'Test Family' as ok;

-- 3) Provision a child (what the create-child edge function does, minus real auth signup)
insert into auth.users (id, email, raw_user_meta_data)
values ('22222222-2222-2222-2222-222222222222', 'child.test@internal.familysuccess.app', '{"kind":"child","full_name":"Kid One"}'::jsonb);

insert into public.children (id, family_id, user_id, internal_email, name)
values ('33333333-3333-3333-3333-333333333333', :'fam_id', '22222222-2222-2222-2222-222222222222', 'child.test@internal.familysuccess.app', 'Kid One');

select 'child balance starts at 0' as check, points_balance = 0 as ok from public.children where id = '33333333-3333-3333-3333-333333333333';

-- 4) Create an auto-approved task and assign it
insert into public.tasks (id, family_id, created_by, title, icon, points, approval_mode, recurrence_type)
values ('44444444-4444-4444-4444-444444444444', :'fam_id', auth.uid(), 'Make bed', 'bed', 10, 'auto', 'daily');

insert into public.task_assignments (id, task_id, child_id)
values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333');

-- Switch to the child's session to complete it themselves
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select * from public.complete_task('55555555-5555-5555-5555-555555555555', current_date);

select 'auto task awarded points' as check, points_balance = 10 and lifetime_points = 10 as ok
from public.children where id = '33333333-3333-3333-3333-333333333333';

select 'first_task achievement unlocked' as check, count(*) = 1 as ok
from public.child_achievements ca
join public.achievements a on a.id = ca.achievement_id
where ca.child_id = '33333333-3333-3333-3333-333333333333' and a.key = 'first_task';

-- 5) Manual-approval task
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.tasks (id, family_id, created_by, title, icon, points, approval_mode, recurrence_type)
values ('66666666-6666-6666-6666-666666666666', :'fam_id', auth.uid(), 'Homework', 'pencil', 20, 'manual', 'daily');

insert into public.task_assignments (id, task_id, child_id)
values ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333');

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select * from public.complete_task('77777777-7777-7777-7777-777777777777', current_date) \gset comp_

select 'manual completion is pending, no points yet' as check,
  status = 'pending_approval' and points_balance = 10 as ok
from public.task_completions tc, public.children c
where tc.id = :'comp_id' and c.id = '33333333-3333-3333-3333-333333333333';

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.decide_task_completion(:'comp_id', true);

select 'approval awarded points' as check, points_balance = 30 as ok
from public.children where id = '33333333-3333-3333-3333-333333333333';

-- 6) Manual bonus / deduction
select public.award_points('33333333-3333-3333-3333-333333333333', 20, 'Helped a sibling');
select public.deduct_points('33333333-3333-3333-3333-333333333333', 100, 'Broke the agreement');

select 'deduction clamped at zero, not negative' as check, points_balance = 0 as ok
from public.children where id = '33333333-3333-3333-3333-333333333333';

-- top back up for the redemption test
select public.award_points('33333333-3333-3333-3333-333333333333', 200, 'top up for testing');

-- 7) Reward redemption (child requests, parent approves)
insert into public.rewards (id, family_id, created_by, name, icon, cost_points)
values ('88888888-8888-8888-8888-888888888888', :'fam_id', auth.uid(), 'Ice cream', 'gift', 100);

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select * from public.request_redemption('88888888-8888-8888-8888-888888888888') \gset red_

select 'redemption pending, points not yet deducted' as check,
  status = 'pending' and points_balance = 200 as ok
from public.reward_redemptions r, public.children c
where r.id = :'red_id' and c.id = '33333333-3333-3333-3333-333333333333';

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.decide_redemption(:'red_id', true);

select 'redemption approved, points deducted exactly once' as check, points_balance = 100 as ok
from public.children where id = '33333333-3333-3333-3333-333333333333';

-- 8) Double-approval must fail (idempotency guard)
select public.decide_redemption(:'red_id', true);
