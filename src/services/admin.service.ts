import { supabase } from '@/lib/supabase';
import {
  AdminAuditLogEntry,
  AdminRole,
  AdminUser,
  Payment,
  Plan,
  PromoCode,
  PromoValidationResult,
} from '@/types/admin';

/** Returns the current user's admin role, or null if they aren't staff. */
export async function getMyAdminRole(): Promise<AdminRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.is_active) return null;
  return data.role as AdminRole;
}

export async function listAdminUsers(): Promise<(AdminUser & { user: { full_name: string; email: string | null } })[]> {
  const { data, error } = await supabase.from('admin_users').select('*, user:users(full_name, email)');
  if (error) throw error;
  return data as unknown as (AdminUser & { user: { full_name: string; email: string | null } })[];
}

export async function addAdminByEmail(email: string, role: Exclude<AdminRole, 'owner'>): Promise<AdminUser> {
  const { data, error } = await supabase.rpc('add_admin_by_email', { p_email: email, p_role: role });
  if (error) throw error;
  return data as AdminUser;
}

export async function setAdminActive(userId: string, isActive: boolean): Promise<AdminUser> {
  const { data, error } = await supabase.rpc('set_admin_active', { p_user_id: userId, p_is_active: isActive });
  if (error) throw error;
  return data as AdminUser;
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
export async function listAllPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.from('plans').select('*').order('sort_order');
  if (error) throw error;
  return data as Plan[];
}

export type NewPlanInput = Omit<Plan, 'id' | 'created_at' | 'updated_at'>;

export async function createPlan(input: NewPlanInput): Promise<Plan> {
  const { data, error } = await supabase.from('plans').insert(input).select().single();
  if (error) throw error;
  return data as Plan;
}

export async function updatePlan(id: string, patch: Partial<NewPlanInput>): Promise<Plan> {
  const { data, error } = await supabase.from('plans').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Plan;
}

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------
export async function listPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as PromoCode[];
}

export type NewPromoCodeInput = Omit<
  PromoCode,
  'id' | 'created_at' | 'updated_at' | 'times_redeemed' | 'status' | 'created_by'
>;

export async function createPromoCode(input: NewPromoCodeInput, planIds: string[]): Promise<PromoCode> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({ ...input, code: input.code.toUpperCase(), created_by: user.id })
    .select()
    .single();
  if (error) throw error;

  if (planIds.length > 0) {
    const { error: linkErr } = await supabase
      .from('promo_code_plans')
      .insert(planIds.map((plan_id) => ({ promo_code_id: data.id, plan_id })));
    if (linkErr) throw linkErr;
  }

  return data as PromoCode;
}

export async function updatePromoCodeStatus(id: string, status: PromoCode['status']) {
  const { error } = await supabase.from('promo_codes').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deletePromoCode(id: string) {
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);
  if (error) throw error;
}

export async function getPromoCodePlanIds(promoCodeId: string): Promise<string[]> {
  const { data, error } = await supabase.from('promo_code_plans').select('plan_id').eq('promo_code_id', promoCodeId);
  if (error) throw error;
  return (data as { plan_id: string }[]).map((r) => r.plan_id);
}

// ---------------------------------------------------------------------------
// Checkout (customer-facing, still admin-adjacent types)
// ---------------------------------------------------------------------------
export async function validatePromoCode(code: string, planId: string): Promise<PromoValidationResult> {
  const { data, error } = await supabase.rpc('validate_promo_code', { p_code: code, p_plan_id: planId });
  if (error) throw error;
  return (data as PromoValidationResult[])[0];
}

export async function subscribeToPlan(planId: string, code?: string): Promise<Payment> {
  const { data, error } = await supabase.rpc('subscribe_family_to_plan', { p_plan_id: planId, p_code: code ?? null });
  if (error) throw error;
  return data as Payment;
}

// ---------------------------------------------------------------------------
// Customers (owner dashboard)
// ---------------------------------------------------------------------------
/** One row per account (kind='parent') — family_id is null until they've created a family. */
export interface CustomerAccount {
  user_id: string;
  full_name: string;
  email: string | null;
  created_at: string;
  family_id: string | null;
  family_name: string | null;
  family_code: string | null;
  plan_name: string | null;
  plan_key: string | null;
}

// Three flat queries instead of one deep nested embed (users -> family_members
// -> families -> subscriptions -> plans): each step can fail or come back
// empty on its own, which is far easier to diagnose than one 4-level embed.
export async function listCustomerAccounts(search?: string): Promise<CustomerAccount[]> {
  let userQuery = supabase
    .from('users')
    .select('id, full_name, email, created_at')
    .eq('kind', 'parent')
    .order('created_at', { ascending: false })
    .limit(200);

  if (search && search.trim()) {
    userQuery = userQuery.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }

  const { data: userRows, error: usersError } = await userQuery;
  if (usersError) throw usersError;
  const users = (userRows ?? []) as { id: string; full_name: string; email: string | null; created_at: string }[];
  if (users.length === 0) return [];

  const userIds = users.map((u) => u.id);
  const { data: membershipRows, error: membershipError } = await supabase
    .from('family_members')
    .select('user_id, family:families(id, name, family_code)')
    .in('user_id', userIds);
  if (membershipError) throw membershipError;

  type Membership = { user_id: string; family: { id: string; name: string; family_code: string } | null };
  const familyByUser = new Map<string, { id: string; name: string; family_code: string }>();
  for (const m of (membershipRows ?? []) as unknown as Membership[]) {
    if (m.family) familyByUser.set(m.user_id, m.family);
  }

  const familyIds = [...new Set([...familyByUser.values()].map((f) => f.id))];
  const planByFamily = new Map<string, { name: string; key: string }>();
  if (familyIds.length > 0) {
    const { data: subRows, error: subsError } = await supabase
      .from('subscriptions')
      .select('family_id, plan:plans(name, key)')
      .in('family_id', familyIds);
    if (subsError) throw subsError;
    type SubRow = { family_id: string; plan: { name: string; key: string } | null };
    for (const s of (subRows ?? []) as unknown as SubRow[]) {
      if (s.plan) planByFamily.set(s.family_id, s.plan);
    }
  }

  return users.map((u) => {
    const family = familyByUser.get(u.id) ?? null;
    const plan = family ? (planByFamily.get(family.id) ?? null) : null;
    return {
      user_id: u.id,
      full_name: u.full_name || '—',
      email: u.email,
      created_at: u.created_at,
      family_id: family?.id ?? null,
      family_name: family?.name ?? null,
      family_code: family?.family_code ?? null,
      plan_name: plan?.name ?? null,
      plan_key: plan?.key ?? null,
    };
  });
}

export interface FamilyDetail {
  id: string;
  name: string;
  family_code: string;
  created_at: string;
  owner_name: string;
  owner_email: string | null;
  plan_name: string | null;
  plan_key: string | null;
  current_period_end: string | null;
  children_count: number;
}

export async function getCustomerDetail(familyId: string): Promise<FamilyDetail> {
  const { data, error } = await supabase
    .from('families')
    .select(
      'id, name, family_code, created_at, created_by_user:users!families_created_by_fkey(full_name, email), subscription:subscriptions(current_period_end, plan:plans(name, key)), children(count)',
    )
    .eq('id', familyId)
    .single();
  if (error) throw error;

  type Row = {
    id: string;
    name: string;
    family_code: string;
    created_at: string;
    created_by_user: { full_name: string; email: string | null } | null;
    subscription: { current_period_end: string | null; plan: { name: string; key: string } | null } | null;
    children: { count: number }[];
  };
  const row = data as unknown as Row;

  return {
    id: row.id,
    name: row.name,
    family_code: row.family_code,
    created_at: row.created_at,
    owner_name: row.created_by_user?.full_name ?? '—',
    owner_email: row.created_by_user?.email ?? null,
    plan_name: row.subscription?.plan?.name ?? null,
    plan_key: row.subscription?.plan?.key ?? null,
    current_period_end: row.subscription?.current_period_end ?? null,
    children_count: row.children?.[0]?.count ?? 0,
  };
}

/** Grants a family a plan directly (owner/admin only). `expiresAt = null` means it never expires on its own. */
export async function grantSubscription(familyId: string, planId: string, expiresAt: string | null): Promise<void> {
  const { error } = await supabase.rpc('admin_grant_subscription', {
    p_family_id: familyId,
    p_plan_id: planId,
    p_expires_at: expiresAt,
  });
  if (error) throw error;
}

export async function listFamilyPayments(familyId: string): Promise<(Payment & { plan_name: string })[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*, plan:plans(name)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = Payment & { plan: { name: string } };
  return (data as unknown as Row[]).map((row) => ({ ...row, plan_name: row.plan.name }));
}

export async function listFamilyRedemptions(familyId: string) {
  const { data, error } = await supabase
    .from('promo_code_redemptions')
    .select('*, promo_code:promo_codes(code)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as { id: string; discount_amount: number; final_amount: number; created_at: string; promo_code: { code: string } }[];
}

export async function listAuditLog(limit = 50): Promise<AdminAuditLogEntry[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AdminAuditLogEntry[];
}

// ---------------------------------------------------------------------------
// Owner analytics — platform-wide, aggregated only. Every RPC here is
// checked server-side against is_admin(); a parent account gets a plain
// authorization error back, never data, no matter how it's called.
// ---------------------------------------------------------------------------
export interface AnalyticsRange {
  start: string;
  end: string;
}

export interface OwnerOverviewStats {
  total_users: number;
  total_families: number;
  total_children: number;
  new_users: number;
  new_families: number;
  new_children: number;
  avg_children_per_family: number;
}

export interface OwnerEngagementStats {
  dau: number;
  wau: number;
  mau: number;
  dormant_accounts: number;
}

export interface OwnerRetentionStats {
  previously_active: number;
  still_active: number;
  retention_rate: number | null;
}

export interface OwnerTaskStats {
  tasks_created: number;
  programs_created: number;
  completions_recorded: number;
  completions_approved: number;
  completion_rate: number | null;
}

export interface OwnerPointsStats {
  points_granted: number;
  points_spent: number;
}

export interface OwnerRewardsStats {
  rewards_created: number;
  redemptions_requested: number;
  redemptions_approved: number;
}

export interface OwnerFeatureUsage {
  event_type: string;
  usage_count: number;
}

export interface OwnerTemplateUsage {
  template_name: string;
  usage_count: number;
}

export interface OwnerFunnelStep {
  step: string;
  step_order: number;
  account_count: number;
}

export interface OwnerSubscriptionStats {
  free_count: number;
  plus_count: number;
  pro_count: number;
  new_paid_in_period: number;
  canceled_in_period: number;
  churn_rate: number | null;
  revenue_available: boolean;
}

export async function getOwnerOverviewStats(range: AnalyticsRange): Promise<OwnerOverviewStats> {
  const { data, error } = await supabase.rpc('owner_overview_stats', { p_start: range.start, p_end: range.end }).single();
  if (error) throw error;
  return data as OwnerOverviewStats;
}

export async function getOwnerEngagementStats(): Promise<OwnerEngagementStats> {
  const { data, error } = await supabase.rpc('owner_engagement_stats').single();
  if (error) throw error;
  return data as OwnerEngagementStats;
}

export async function getOwnerRetentionStats(): Promise<OwnerRetentionStats> {
  const { data, error } = await supabase.rpc('owner_retention_stats').single();
  if (error) throw error;
  return data as OwnerRetentionStats;
}

export async function getOwnerTaskStats(range: AnalyticsRange): Promise<OwnerTaskStats> {
  const { data, error } = await supabase.rpc('owner_task_stats', { p_start: range.start, p_end: range.end }).single();
  if (error) throw error;
  return data as OwnerTaskStats;
}

export async function getOwnerPointsStats(range: AnalyticsRange): Promise<OwnerPointsStats> {
  const { data, error } = await supabase.rpc('owner_points_stats', { p_start: range.start, p_end: range.end }).single();
  if (error) throw error;
  return data as OwnerPointsStats;
}

export async function getOwnerRewardsStats(range: AnalyticsRange): Promise<OwnerRewardsStats> {
  const { data, error } = await supabase.rpc('owner_rewards_stats', { p_start: range.start, p_end: range.end }).single();
  if (error) throw error;
  return data as OwnerRewardsStats;
}

export async function getOwnerFeatureUsage(range: AnalyticsRange): Promise<OwnerFeatureUsage[]> {
  const { data, error } = await supabase.rpc('owner_feature_usage', { p_start: range.start, p_end: range.end });
  if (error) throw error;
  return data as OwnerFeatureUsage[];
}

export async function getOwnerTopTemplates(range: AnalyticsRange): Promise<OwnerTemplateUsage[]> {
  const { data, error } = await supabase.rpc('owner_top_templates', { p_start: range.start, p_end: range.end, p_limit: 5 });
  if (error) throw error;
  return data as OwnerTemplateUsage[];
}

export async function getOwnerFunnelStats(range: AnalyticsRange): Promise<OwnerFunnelStep[]> {
  const { data, error } = await supabase.rpc('owner_funnel_stats', { p_start: range.start, p_end: range.end });
  if (error) throw error;
  return data as OwnerFunnelStep[];
}

export async function getOwnerSubscriptionStats(range: AnalyticsRange): Promise<OwnerSubscriptionStats> {
  const { data, error } = await supabase.rpc('owner_subscription_stats', { p_start: range.start, p_end: range.end }).single();
  if (error) throw error;
  return data as OwnerSubscriptionStats;
}
