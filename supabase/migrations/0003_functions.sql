-- ============================================================================
-- Business logic RPCs. These are the ONLY way points, redemptions, task
-- approvals, streaks and achievements are ever mutated. All are
-- SECURITY DEFINER so they can update ledger/derived columns the client role
-- has no direct write access to, but every one of them re-checks
-- authorization against auth.uid() itself — they do not trust the caller.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Balance maintenance: the ledger is the only source of truth. Every insert
-- into point_transactions updates the child's cached balance/lifetime total,
-- then re-evaluates goals and achievements.
-- ----------------------------------------------------------------------------
create or replace function public.apply_point_transaction()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.children
  set points_balance = points_balance + new.amount,
      lifetime_points = lifetime_points + greatest(new.amount, 0)
  where id = new.child_id;

  perform public.check_goals(new.child_id);
  perform public.check_and_award_achievements(new.child_id);

  return new;
end;
$$;

create trigger trg_apply_point_transaction
  after insert on public.point_transactions
  for each row execute function public.apply_point_transaction();

create or replace function public.check_goals(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance int;
  v_goal record;
begin
  select points_balance into v_balance from public.children where id = p_child_id;

  for v_goal in
    select * from public.goals
    where child_id = p_child_id and not is_achieved and target_points <= v_balance
  loop
    update public.goals set is_achieved = true, achieved_at = now() where id = v_goal.id;

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_goal.family_id, p_child_id, 'goal_reached', 'activity.goalReached', jsonb_build_object('goalName', v_goal.name));

    insert into public.notifications (family_id, recipient_user_id, type, title, body, data)
    select v_goal.family_id, fm.user_id, 'goal_reached', 'goals.goalReached', v_goal.name, jsonb_build_object('goalId', v_goal.id)
    from public.family_members fm where fm.family_id = v_goal.family_id;
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Achievements
-- ----------------------------------------------------------------------------
create or replace function public.check_and_award_achievements(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid;
  v_completed_count int;
  v_current_streak int;
  v_goal_reached boolean;
  v_ach record;
  v_inserted uuid;
begin
  select family_id into v_family_id from public.children where id = p_child_id;

  select count(*) into v_completed_count
  from public.task_completions tc
  join public.task_assignments ta on ta.id = tc.task_assignment_id
  where ta.child_id = p_child_id and tc.status in ('approved', 'auto_approved');

  select coalesce(current_streak, 0) into v_current_streak
  from public.streaks where child_id = p_child_id;

  select exists(select 1 from public.goals where child_id = p_child_id and is_achieved) into v_goal_reached;

  for v_ach in select * from public.achievements loop
    if exists (select 1 from public.child_achievements where child_id = p_child_id and achievement_id = v_ach.id) then
      continue;
    end if;

    if v_ach.criteria_type = 'first_task' and v_completed_count >= 1 then
      -- unlock below
    elsif v_ach.criteria_type = 'tasks_count' and v_completed_count >= coalesce(v_ach.criteria_value, 999999) then
      -- unlock below
    elsif v_ach.criteria_type = 'streak_days' and v_current_streak >= coalesce(v_ach.criteria_value, 999999) then
      -- unlock below
    elsif v_ach.criteria_type = 'goal_reached' and v_goal_reached then
      -- unlock below
    elsif v_ach.criteria_type = 'category_count' and v_ach.criteria_category is not null then
      if (
        select count(*) from public.task_completions tc
        join public.task_assignments ta on ta.id = tc.task_assignment_id
        join public.tasks t on t.id = ta.task_id
        where ta.child_id = p_child_id
          and tc.status in ('approved', 'auto_approved')
          and t.category = v_ach.criteria_category
      ) < coalesce(v_ach.criteria_value, 999999) then
        continue;
      end if;
    elsif v_ach.criteria_type = 'all_tasks_in_day' then
      if not public.child_completed_all_tasks_today(p_child_id) then
        continue;
      end if;
    else
      continue;
    end if;

    insert into public.child_achievements (child_id, achievement_id)
    values (p_child_id, v_ach.id)
    on conflict do nothing
    returning id into v_inserted;

    if v_inserted is not null then
      insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
      values (v_family_id, p_child_id, 'achievement_unlocked', 'activity.achievementUnlocked', jsonb_build_object('achievementKey', v_ach.key, 'achievementName', v_ach.name));

      insert into public.notifications (family_id, recipient_user_id, type, title, body, data)
      select v_family_id, fm.user_id, 'achievement_unlocked', 'achievements.newAchievement', v_ach.name, jsonb_build_object('achievementId', v_ach.id)
      from public.family_members fm where fm.family_id = v_family_id;
    end if;
  end loop;
end;
$$;

create or replace function public.child_completed_all_tasks_today(p_child_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select count(*) filter (where tc.id is null) = 0 and count(*) > 0
  from public.task_assignments ta
  join public.tasks t on t.id = ta.task_id
  left join public.task_completions tc
    on tc.task_assignment_id = ta.id
   and tc.occurrence_date = current_date
   and tc.status in ('approved', 'auto_approved')
  where ta.child_id = p_child_id and t.is_active;
$$;

-- ----------------------------------------------------------------------------
-- Streaks
-- ----------------------------------------------------------------------------
create or replace function public.update_streak(p_child_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid;
  v_row public.streaks;
begin
  select family_id into v_family_id from public.children where id = p_child_id;

  insert into public.streaks (child_id, family_id, current_streak, longest_streak, last_completed_date)
  values (p_child_id, v_family_id, 0, 0, null)
  on conflict (child_id) do nothing;

  select * into v_row from public.streaks where child_id = p_child_id for update;

  if v_row.last_completed_date = p_date then
    return; -- already counted today
  elsif v_row.last_completed_date = p_date - 1 then
    update public.streaks
    set current_streak = v_row.current_streak + 1,
        longest_streak = greatest(v_row.longest_streak, v_row.current_streak + 1),
        last_completed_date = p_date,
        updated_at = now()
    where child_id = p_child_id;
  else
    update public.streaks
    set current_streak = 1,
        longest_streak = greatest(v_row.longest_streak, 1),
        last_completed_date = p_date,
        updated_at = now()
    where child_id = p_child_id;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Program completion bonus
-- ----------------------------------------------------------------------------
create or replace function public.check_program_bonus(p_child_id uuid, p_task_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_program record;
  v_family_id uuid;
  v_total_tasks int;
  v_done_tasks int;
  v_already_paid boolean;
begin
  select family_id into v_family_id from public.children where id = p_child_id;

  for v_program in
    select p.* from public.programs p
    join public.program_tasks pt on pt.program_id = p.id
    where pt.task_id = p_task_id and p.is_active and p.completion_bonus_points > 0
  loop
    select count(*) into v_total_tasks
    from public.program_tasks pt
    join public.task_assignments ta on ta.task_id = pt.task_id and ta.child_id = p_child_id
    where pt.program_id = v_program.id;

    if v_total_tasks = 0 then
      continue;
    end if;

    select count(*) into v_done_tasks
    from public.program_tasks pt
    join public.task_assignments ta on ta.task_id = pt.task_id and ta.child_id = p_child_id
    join public.task_completions tc on tc.task_assignment_id = ta.id
      and tc.occurrence_date = p_date and tc.status in ('approved', 'auto_approved')
    where pt.program_id = v_program.id;

    if v_done_tasks < v_total_tasks then
      continue;
    end if;

    select exists (
      select 1 from public.point_transactions
      where child_id = p_child_id and source_type = 'program_bonus' and source_id = v_program.id
        and created_at::date = p_date
    ) into v_already_paid;

    if v_already_paid then
      continue;
    end if;

    insert into public.point_transactions (family_id, child_id, amount, reason, source_type, source_id, created_by)
    values (v_family_id, p_child_id, v_program.completion_bonus_points, v_program.name, 'program_bonus', v_program.id, null);

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_family_id, p_child_id, 'program_bonus', 'activity.programBonus', jsonb_build_object('programName', v_program.name, 'points', v_program.completion_bonus_points));
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Challenge progress
-- ----------------------------------------------------------------------------
create or replace function public.record_challenge_progress(p_child_id uuid, p_task_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_challenge record;
  v_member record;
  v_family_id uuid;
  v_total_days int;
begin
  select family_id into v_family_id from public.children where id = p_child_id;

  for v_challenge in
    select * from public.challenges
    where linked_task_id = p_task_id and is_active and p_date between start_date and end_date
  loop
    select * into v_member from public.challenge_members
    where challenge_id = v_challenge.id and child_id = p_child_id;

    if v_member is null then
      continue; -- child hasn't joined this challenge
    end if;

    if v_member.is_completed then
      continue;
    end if;

    update public.challenge_members
    set progress_count = progress_count + 1
    where id = v_member.id
    returning progress_count into v_member.progress_count;

    v_total_days := (v_challenge.end_date - v_challenge.start_date) + 1;

    if v_member.progress_count >= v_total_days then
      update public.challenge_members
      set is_completed = true, completed_at = now()
      where id = v_member.id;

      if v_challenge.reward_points > 0 then
        insert into public.point_transactions (family_id, child_id, amount, reason, source_type, source_id, created_by)
        values (v_family_id, p_child_id, v_challenge.reward_points, v_challenge.name, 'challenge_reward', v_challenge.id, null);
      end if;

      insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
      values (v_family_id, p_child_id, 'challenge_completed', 'activity.challengeCompleted', jsonb_build_object('challengeName', v_challenge.name));
    end if;
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Shared post-processing once a completion becomes "counted"
-- ----------------------------------------------------------------------------
create or replace function public.after_task_counted(p_completion_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_child_id uuid;
  v_task_id uuid;
  v_date date;
begin
  select ta.child_id, ta.task_id, tc.occurrence_date
  into v_child_id, v_task_id, v_date
  from public.task_completions tc
  join public.task_assignments ta on ta.id = tc.task_assignment_id
  where tc.id = p_completion_id;

  perform public.update_streak(v_child_id, v_date);
  perform public.check_program_bonus(v_child_id, v_task_id, v_date);
  perform public.record_challenge_progress(v_child_id, v_task_id, v_date);
end;
$$;

-- ----------------------------------------------------------------------------
-- Family / child provisioning
-- ----------------------------------------------------------------------------
create or replace function public.generate_family_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_exists boolean;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;
    select exists(select 1 from public.families where family_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

create or replace function public.create_family(p_name text)
returns public.families
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family public.families;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.families (name, family_code, created_by)
  values (trim(p_name), public.generate_family_code(), auth.uid())
  returning * into v_family;

  insert into public.family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), 'owner');

  insert into public.subscriptions (family_id, plan, status)
  values (v_family.id, 'free', 'active');

  return v_family;
end;
$$;

-- ----------------------------------------------------------------------------
-- Task completion / approval
-- ----------------------------------------------------------------------------
create or replace function public.complete_task(p_assignment_id uuid, p_occurrence_date date, p_notes text default null)
returns public.task_completions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_task public.tasks;
  v_assignment public.task_assignments;
  v_completion public.task_completions;
  v_child public.children;
begin
  select * into v_assignment from public.task_assignments where id = p_assignment_id;
  if v_assignment is null then
    raise exception 'assignment not found';
  end if;

  select * into v_task from public.tasks where id = v_assignment.task_id;
  select * into v_child from public.children where id = v_assignment.child_id;

  if not (v_child.user_id = auth.uid() or public.is_family_parent(v_task.family_id)) then
    raise exception 'not authorized';
  end if;

  if v_task.approval_mode = 'auto' then
    insert into public.task_completions (task_assignment_id, occurrence_date, status, points_awarded, notes, decided_at)
    values (p_assignment_id, p_occurrence_date, 'auto_approved', v_task.points, p_notes, now())
    returning * into v_completion;

    insert into public.point_transactions (family_id, child_id, amount, reason, source_type, source_id, created_by)
    values (v_task.family_id, v_child.id, v_task.points, v_task.title, 'task_completion', v_completion.id, auth.uid())
    returning id into v_completion.point_transaction_id;

    update public.task_completions set point_transaction_id = v_completion.point_transaction_id where id = v_completion.id;

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_task.family_id, v_child.id, 'task_completed', 'activity.taskCompletedAuto', jsonb_build_object('taskName', v_task.title, 'points', v_task.points));

    perform public.after_task_counted(v_completion.id);
  else
    insert into public.task_completions (task_assignment_id, occurrence_date, status, points_awarded, notes)
    values (p_assignment_id, p_occurrence_date, 'pending_approval', 0, p_notes)
    returning * into v_completion;

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_task.family_id, v_child.id, 'task_pending_approval', 'activity.taskPendingApproval', jsonb_build_object('taskName', v_task.title));

    insert into public.notifications (family_id, recipient_user_id, type, title, body, data)
    select v_task.family_id, fm.user_id, 'task_pending_approval', 'notifications.taskPendingApproval', v_task.title, jsonb_build_object('completionId', v_completion.id)
    from public.family_members fm where fm.family_id = v_task.family_id;
  end if;

  return v_completion;
end;
$$;

create or replace function public.decide_task_completion(p_completion_id uuid, p_approve boolean, p_note text default null)
returns public.task_completions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_completion public.task_completions;
  v_assignment public.task_assignments;
  v_task public.tasks;
  v_tx_id uuid;
begin
  select * into v_completion from public.task_completions where id = p_completion_id for update;
  if v_completion is null then
    raise exception 'completion not found';
  end if;
  if v_completion.status <> 'pending_approval' then
    raise exception 'already decided';
  end if;

  select * into v_assignment from public.task_assignments where id = v_completion.task_assignment_id;
  select * into v_task from public.tasks where id = v_assignment.task_id;

  if not public.is_family_parent(v_task.family_id) then
    raise exception 'not authorized';
  end if;

  if p_approve then
    insert into public.point_transactions (family_id, child_id, amount, reason, source_type, source_id, created_by)
    values (v_task.family_id, v_assignment.child_id, v_task.points, v_task.title, 'task_completion', v_completion.id, auth.uid())
    returning id into v_tx_id;

    update public.task_completions
    set status = 'approved', points_awarded = v_task.points, decided_at = now(), decided_by = auth.uid(),
        point_transaction_id = v_tx_id, notes = coalesce(p_note, notes)
    where id = p_completion_id
    returning * into v_completion;

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_task.family_id, v_assignment.child_id, 'task_approved', 'activity.taskApproved', jsonb_build_object('taskName', v_task.title, 'points', v_task.points));

    perform public.after_task_counted(v_completion.id);
  else
    update public.task_completions
    set status = 'rejected', decided_at = now(), decided_by = auth.uid(), notes = coalesce(p_note, notes)
    where id = p_completion_id
    returning * into v_completion;

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_task.family_id, v_assignment.child_id, 'task_rejected', 'activity.taskRejected', jsonb_build_object('taskName', v_task.title));
  end if;

  insert into public.notifications (family_id, recipient_user_id, type, title, body, data)
  select v_task.family_id, c.user_id, case when p_approve then 'task_approved' else 'task_rejected' end,
    case when p_approve then 'notifications.taskApproved' else 'notifications.taskRejected' end, v_task.title, jsonb_build_object('completionId', v_completion.id)
  from public.children c where c.id = v_assignment.child_id and c.user_id is not null;

  return v_completion;
end;
$$;

-- ----------------------------------------------------------------------------
-- Manual points
-- ----------------------------------------------------------------------------
create or replace function public.award_points(p_child_id uuid, p_amount int, p_reason text)
returns public.point_transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid;
  v_tx public.point_transactions;
begin
  select family_id into v_family_id from public.children where id = p_child_id;
  if not public.is_family_parent(v_family_id) then
    raise exception 'not authorized';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'reason is required';
  end if;

  insert into public.point_transactions (family_id, child_id, amount, reason, source_type, created_by)
  values (v_family_id, p_child_id, p_amount, p_reason, 'manual_bonus', auth.uid())
  returning * into v_tx;

  insert into public.activity_events (family_id, actor_child_id, actor_user_id, event_type, message_key, message_params)
  values (v_family_id, p_child_id, auth.uid(), 'manual_bonus', 'activity.manualBonus', jsonb_build_object('points', p_amount, 'reason', p_reason));

  return v_tx;
end;
$$;

create or replace function public.deduct_points(p_child_id uuid, p_amount int, p_reason text)
returns public.point_transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid;
  v_balance int;
  v_deduct int;
  v_tx public.point_transactions;
begin
  select family_id, points_balance into v_family_id, v_balance from public.children where id = p_child_id;
  if not public.is_family_parent(v_family_id) then
    raise exception 'not authorized';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'a reason is required to deduct points';
  end if;

  v_deduct := least(p_amount, greatest(v_balance, 0));

  insert into public.point_transactions (family_id, child_id, amount, reason, source_type, created_by)
  values (v_family_id, p_child_id, -v_deduct, p_reason, 'manual_deduction', auth.uid())
  returning * into v_tx;

  insert into public.activity_events (family_id, actor_child_id, actor_user_id, event_type, message_key, message_params)
  values (v_family_id, p_child_id, auth.uid(), 'manual_deduction', 'activity.manualDeduction', jsonb_build_object('points', v_deduct, 'reason', p_reason));

  return v_tx;
end;
$$;

-- ----------------------------------------------------------------------------
-- Rewards redemption (atomic, race-safe)
-- ----------------------------------------------------------------------------
create or replace function public.request_redemption(p_reward_id uuid)
returns public.reward_redemptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reward public.rewards;
  v_child_id uuid;
  v_balance int;
  v_redemption public.reward_redemptions;
begin
  v_child_id := public.current_child_id();
  if v_child_id is null then
    raise exception 'only a child can request a redemption';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id for update;
  if v_reward is null or not v_reward.is_active then
    raise exception 'reward not available';
  end if;
  if v_reward.usage_limit is not null and v_reward.times_redeemed >= v_reward.usage_limit then
    raise exception 'reward usage limit reached';
  end if;

  select points_balance into v_balance from public.children where id = v_child_id;
  if v_balance < v_reward.cost_points then
    raise exception 'insufficient points';
  end if;

  insert into public.reward_redemptions (reward_id, child_id, family_id, points_spent, status)
  values (v_reward.id, v_child_id, v_reward.family_id, v_reward.cost_points, 'pending')
  returning * into v_redemption;

  insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
  values (v_reward.family_id, v_child_id, 'redemption_requested', 'activity.redemptionRequested', jsonb_build_object('rewardName', v_reward.name));

  insert into public.notifications (family_id, recipient_user_id, type, title, body, data)
  select v_reward.family_id, fm.user_id, 'redemption_requested', 'notifications.redemptionRequested', v_reward.name, jsonb_build_object('redemptionId', v_redemption.id)
  from public.family_members fm where fm.family_id = v_reward.family_id;

  return v_redemption;
end;
$$;

create or replace function public.decide_redemption(p_redemption_id uuid, p_approve boolean, p_note text default null)
returns public.reward_redemptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_redemption public.reward_redemptions;
  v_reward public.rewards;
  v_balance int;
  v_tx_id uuid;
begin
  select * into v_redemption from public.reward_redemptions where id = p_redemption_id for update;
  if v_redemption is null then
    raise exception 'redemption not found';
  end if;
  if v_redemption.status <> 'pending' then
    raise exception 'already decided';
  end if;
  if not public.is_family_parent(v_redemption.family_id) then
    raise exception 'not authorized';
  end if;

  select * into v_reward from public.rewards where id = v_redemption.reward_id for update;

  if p_approve then
    select points_balance into v_balance from public.children where id = v_redemption.child_id;
    if v_balance < v_redemption.points_spent then
      raise exception 'child no longer has enough points';
    end if;

    insert into public.point_transactions (family_id, child_id, amount, reason, source_type, source_id, created_by)
    values (v_redemption.family_id, v_redemption.child_id, -v_redemption.points_spent, v_reward.name, 'reward_redemption', v_redemption.id, auth.uid())
    returning id into v_tx_id;

    update public.reward_redemptions
    set status = 'approved', decided_at = now(), decided_by = auth.uid(), decision_note = p_note, point_transaction_id = v_tx_id
    where id = p_redemption_id
    returning * into v_redemption;

    update public.rewards set times_redeemed = times_redeemed + 1 where id = v_reward.id;

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_redemption.family_id, v_redemption.child_id, 'redemption_approved', 'activity.redemptionApproved', jsonb_build_object('rewardName', v_reward.name));
  else
    update public.reward_redemptions
    set status = 'rejected', decided_at = now(), decided_by = auth.uid(), decision_note = p_note
    where id = p_redemption_id
    returning * into v_redemption;

    insert into public.activity_events (family_id, actor_child_id, event_type, message_key, message_params)
    values (v_redemption.family_id, v_redemption.child_id, 'redemption_rejected', 'activity.redemptionRejected', jsonb_build_object('rewardName', v_reward.name));
  end if;

  insert into public.notifications (family_id, recipient_user_id, type, title, body, data)
  select v_redemption.family_id, c.user_id, case when p_approve then 'redemption_approved' else 'redemption_rejected' end,
    case when p_approve then 'notifications.redemptionApproved' else 'notifications.redemptionRejected' end, v_reward.name, jsonb_build_object('redemptionId', v_redemption.id)
  from public.children c where c.id = v_redemption.child_id and c.user_id is not null;

  return v_redemption;
end;
$$;

-- ----------------------------------------------------------------------------
-- Programs from templates
-- ----------------------------------------------------------------------------
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
  if v_template.is_premium and coalesce(v_plan, 'free') <> 'premium' then
    raise exception 'this template requires Premium';
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

create or replace function public.enroll_child_in_program(p_program_id uuid, p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_family_id uuid;
begin
  select family_id into v_family_id from public.programs where id = p_program_id;
  if not public.is_family_parent(v_family_id) then
    raise exception 'not authorized';
  end if;

  insert into public.task_assignments (task_id, child_id)
  select pt.task_id, p_child_id
  from public.program_tasks pt
  where pt.program_id = p_program_id
  on conflict do nothing;
end;
$$;

-- ----------------------------------------------------------------------------
-- Challenges
-- ----------------------------------------------------------------------------
create or replace function public.join_challenge(p_challenge_id uuid)
returns public.challenge_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_child_id uuid;
  v_member public.challenge_members;
begin
  v_child_id := public.current_child_id();
  if v_child_id is null then
    raise exception 'only a child can join a challenge';
  end if;

  insert into public.challenge_members (challenge_id, child_id)
  values (p_challenge_id, v_child_id)
  on conflict (challenge_id, child_id) do nothing
  returning * into v_member;

  return v_member;
end;
$$;
