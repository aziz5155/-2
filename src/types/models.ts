export type UserKind = 'parent' | 'child';
export type FamilyRole = 'owner' | 'parent';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'custom_days' | 'monthly';
export type ApprovalMode = 'manual' | 'auto';
export type CompletionStatus = 'pending_approval' | 'approved' | 'rejected' | 'auto_approved';
export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PointSourceType =
  | 'task_completion'
  | 'program_bonus'
  | 'manual_bonus'
  | 'manual_deduction'
  | 'reward_redemption'
  | 'redemption_refund'
  | 'challenge_reward';
export type SubscriptionPlan = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trialing' | 'none';
export type AchievementCriteria =
  | 'first_task'
  | 'tasks_count'
  | 'streak_days'
  | 'all_tasks_in_day'
  | 'goal_reached'
  | 'category_count';

export interface AppUser {
  id: string;
  kind: UserKind;
  full_name: string;
  avatar_url: string | null;
  locale: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  family_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  invited_by: string | null;
  created_at: string;
}

export interface Child {
  id: string;
  family_id: string;
  user_id: string | null;
  internal_email: string | null;
  name: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  birth_year: number | null;
  points_balance: number;
  lifetime_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Streak {
  child_id: string;
  family_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

export interface Task {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  icon: string;
  category: string | null;
  points: number;
  priority: TaskPriority;
  recurrence_type: RecurrenceType;
  recurrence_days: number[];
  recurrence_day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  time_of_day: string | null;
  approval_mode: ApprovalMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  child_id: string;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_assignment_id: string;
  occurrence_date: string;
  status: CompletionStatus;
  points_awarded: number;
  notes: string | null;
  completed_at: string;
  decided_at: string | null;
  decided_by: string | null;
  point_transaction_id: string | null;
  created_at: string;
}

export interface Program {
  id: string;
  family_id: string;
  created_by: string;
  name: string;
  description: string | null;
  icon: string;
  template_key: string | null;
  completion_bonus_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramTask {
  id: string;
  program_id: string;
  task_id: string;
  sort_order: number;
  created_at: string;
}

export interface PointTransaction {
  id: string;
  family_id: string;
  child_id: string;
  amount: number;
  reason: string;
  source_type: PointSourceType;
  source_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  family_id: string;
  created_by: string;
  name: string;
  description: string | null;
  icon: string;
  cost_points: number;
  is_active: boolean;
  usage_limit: number | null;
  times_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  child_id: string;
  family_id: string;
  points_spent: number;
  status: RedemptionStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string | null;
  point_transaction_id: string | null;
}

export interface Goal {
  id: string;
  child_id: string;
  family_id: string;
  name: string;
  icon: string;
  target_points: number;
  is_achieved: boolean;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  criteria_type: AchievementCriteria;
  criteria_value: number | null;
  criteria_category: string | null;
  sort_order: number;
}

export interface ChildAchievement {
  id: string;
  child_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Challenge {
  id: string;
  family_id: string;
  created_by: string;
  name: string;
  description: string | null;
  icon: string;
  linked_task_id: string | null;
  start_date: string;
  end_date: string;
  reward_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChallengeMember {
  id: string;
  challenge_id: string;
  child_id: string;
  joined_at: string;
  progress_count: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface ActivityEvent {
  id: string;
  family_id: string;
  actor_child_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  message_key: string;
  message_params: Record<string, unknown>;
  created_at: string;
}

export interface AppNotification {
  id: string;
  family_id: string;
  recipient_user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  family_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: string;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramTemplate {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  is_premium: boolean;
  sort_order: number;
}

export interface ProgramTemplateTask {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string | null;
  points: number;
  time_of_day: string | null;
  sort_order: number;
}

/** Level derived client-side from a child's lifetime_points. */
export interface LevelInfo {
  level: number;
  nameKey: string;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number; // 0..1 towards next level
}
