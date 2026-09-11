-- ============================================================================
-- Family Success App — Initial schema
-- Extensions, enums, core tables, indexes, updated_at triggers.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_kind as enum ('parent', 'child');
create type family_role as enum ('owner', 'parent');
create type task_priority as enum ('low', 'medium', 'high');
create type recurrence_type as enum ('once', 'daily', 'weekly', 'custom_days', 'monthly');
create type approval_mode as enum ('manual', 'auto');
create type completion_status as enum ('pending_approval', 'approved', 'rejected', 'auto_approved');
create type redemption_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type point_source_type as enum (
  'task_completion',
  'program_bonus',
  'manual_bonus',
  'manual_deduction',
  'reward_redemption',
  'redemption_refund',
  'challenge_reward'
);
create type subscription_plan as enum ('free', 'premium');
create type subscription_status as enum ('active', 'canceled', 'expired', 'trialing', 'none');
create type achievement_criteria as enum (
  'first_task',
  'tasks_count',
  'streak_days',
  'all_tasks_in_day',
  'goal_reached',
  'category_count'
);

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- users — 1:1 with auth.users, covers both parent and child accounts
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  kind user_kind not null default 'parent',
  full_name text not null default '',
  avatar_url text,
  locale text not null default 'ar',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- families
-- ----------------------------------------------------------------------------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  family_code text not null unique,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_families_updated_at
  before update on public.families
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- family_members — parents linked to a family (supports multiple parents)
-- ----------------------------------------------------------------------------
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role family_role not null default 'parent',
  invited_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

-- ----------------------------------------------------------------------------
-- children
-- ----------------------------------------------------------------------------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid unique references public.users (id) on delete set null,
  internal_email text unique,
  name text not null,
  avatar_url text,
  avatar_emoji text,
  birth_year int,
  points_balance int not null default 0,
  lifetime_points int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_children_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

-- Lock down balance columns: only SECURITY DEFINER functions (owned by a
-- privileged role) may change them. Parents may still update profile fields.
revoke update on public.children from authenticated;
grant update (name, avatar_url, avatar_emoji, birth_year, is_active) on public.children to authenticated;

-- ----------------------------------------------------------------------------
-- streaks — one row per child
-- ----------------------------------------------------------------------------
create table public.streaks (
  child_id uuid primary key references public.children (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_completed_date date,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references public.users (id),
  title text not null,
  description text,
  icon text not null default 'star',
  category text,
  points int not null check (points >= 0),
  priority task_priority not null default 'medium',
  recurrence_type recurrence_type not null default 'once',
  recurrence_days int[] not null default '{}', -- 0=Sun..6=Sat, used for weekly/custom_days
  recurrence_day_of_month int,
  start_date date not null default current_date,
  end_date date,
  time_of_day time,
  approval_mode approval_mode not null default 'manual',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- task_assignments — which children a task applies to
-- ----------------------------------------------------------------------------
create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, child_id)
);

-- ----------------------------------------------------------------------------
-- task_completions — one row per occurrence of a recurring (or one-off) task
-- ----------------------------------------------------------------------------
create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_assignment_id uuid not null references public.task_assignments (id) on delete cascade,
  occurrence_date date not null,
  status completion_status not null default 'pending_approval',
  points_awarded int not null default 0,
  notes text,
  completed_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.users (id),
  point_transaction_id uuid,
  created_at timestamptz not null default now(),
  unique (task_assignment_id, occurrence_date)
);

-- No direct client writes: all completion/approval flows go through RPCs.
revoke insert, update, delete on public.task_completions from authenticated;

-- ----------------------------------------------------------------------------
-- programs & program_tasks
-- ----------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references public.users (id),
  name text not null,
  description text,
  icon text not null default 'sunrise',
  template_key text,
  completion_bonus_points int not null default 0 check (completion_bonus_points >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_programs_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

create table public.program_tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (program_id, task_id)
);

-- ----------------------------------------------------------------------------
-- point_transactions — append-only ledger
-- ----------------------------------------------------------------------------
create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  amount int not null,
  reason text not null,
  source_type point_source_type not null,
  source_id uuid,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

revoke insert, update, delete on public.point_transactions from authenticated;

-- ----------------------------------------------------------------------------
-- rewards & reward_redemptions
-- ----------------------------------------------------------------------------
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references public.users (id),
  name text not null,
  description text,
  icon text not null default 'gift',
  cost_points int not null check (cost_points > 0),
  is_active boolean not null default true,
  usage_limit int,
  times_redeemed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_rewards_updated_at
  before update on public.rewards
  for each row execute function public.set_updated_at();

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  points_spent int not null,
  status redemption_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.users (id),
  decision_note text,
  point_transaction_id uuid
);

revoke insert, update, delete on public.reward_redemptions from authenticated;

-- ----------------------------------------------------------------------------
-- goals
-- ----------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  icon text not null default 'target',
  target_points int not null check (target_points > 0),
  is_achieved boolean not null default false,
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- achievements (global catalog) & child_achievements
-- ----------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  icon text not null default 'trophy',
  criteria_type achievement_criteria not null,
  criteria_value int,
  criteria_category text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.child_achievements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (child_id, achievement_id)
);

revoke insert, update, delete on public.child_achievements from authenticated;

-- ----------------------------------------------------------------------------
-- challenges & challenge_members
-- ----------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references public.users (id),
  name text not null,
  description text,
  icon text not null default 'flag',
  linked_task_id uuid references public.tasks (id) on delete set null,
  start_date date not null,
  end_date date not null,
  reward_points int not null default 0 check (reward_points >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create trigger trg_challenges_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

create table public.challenge_members (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  joined_at timestamptz not null default now(),
  progress_count int not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  unique (challenge_id, child_id)
);

-- ----------------------------------------------------------------------------
-- activity_events — family-wide "what happened" feed
-- ----------------------------------------------------------------------------
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  actor_child_id uuid references public.children (id) on delete set null,
  actor_user_id uuid references public.users (id) on delete set null,
  event_type text not null,
  message_key text not null,
  message_params jsonb not null default '{}',
  created_at timestamptz not null default now()
);

revoke insert, update, delete on public.activity_events from authenticated;

-- ----------------------------------------------------------------------------
-- notifications — per-user, push/in-app
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  recipient_user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

revoke insert, update, delete on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

-- ----------------------------------------------------------------------------
-- subscriptions — one active row per family
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null unique references public.families (id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  provider text not null default 'none',
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

revoke insert, update, delete on public.subscriptions from authenticated;

-- ----------------------------------------------------------------------------
-- program_templates (global catalog) & program_template_tasks
-- ----------------------------------------------------------------------------
create table public.program_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  icon text not null default 'sparkles',
  is_premium boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.program_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.program_templates (id) on delete cascade,
  title text not null,
  description text,
  icon text not null default 'star',
  category text,
  points int not null default 10,
  time_of_day time,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index idx_family_members_family on public.family_members (family_id);
create index idx_family_members_user on public.family_members (user_id);
create index idx_children_family on public.children (family_id);
create index idx_tasks_family on public.tasks (family_id);
create index idx_task_assignments_task on public.task_assignments (task_id);
create index idx_task_assignments_child on public.task_assignments (child_id);
create index idx_task_completions_assignment on public.task_completions (task_assignment_id);
create index idx_task_completions_status on public.task_completions (status);
create index idx_task_completions_date on public.task_completions (occurrence_date);
create index idx_programs_family on public.programs (family_id);
create index idx_program_tasks_program on public.program_tasks (program_id);
create index idx_program_tasks_task on public.program_tasks (task_id);
create index idx_point_tx_child on public.point_transactions (child_id, created_at desc);
create index idx_point_tx_family on public.point_transactions (family_id, created_at desc);
create index idx_rewards_family on public.rewards (family_id);
create index idx_redemptions_family on public.reward_redemptions (family_id, status);
create index idx_redemptions_child on public.reward_redemptions (child_id);
create index idx_goals_child on public.goals (child_id);
create index idx_child_achievements_child on public.child_achievements (child_id);
create index idx_challenges_family on public.challenges (family_id);
create index idx_challenge_members_challenge on public.challenge_members (challenge_id);
create index idx_activity_events_family on public.activity_events (family_id, created_at desc);
create index idx_notifications_recipient on public.notifications (recipient_user_id, is_read, created_at desc);
create index idx_program_template_tasks_template on public.program_template_tasks (template_id);
