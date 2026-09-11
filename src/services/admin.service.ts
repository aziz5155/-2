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
export interface CustomerSummary {
  family_id: string;
  family_name: string;
  family_code: string;
  owner_name: string;
  owner_email: string | null;
  plan_name: string | null;
  plan_key: string | null;
  created_at: string;
}

export async function listCustomers(search?: string): Promise<CustomerSummary[]> {
  let query = supabase
    .from('families')
    .select(
      'id, name, family_code, created_at, created_by_user:users!families_created_by_fkey(full_name, email), subscription:subscriptions(plan:plans(name, key))',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (search && search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  type Row = {
    id: string;
    name: string;
    family_code: string;
    created_at: string;
    created_by_user: { full_name: string; email: string | null } | null;
    subscription: { plan: { name: string; key: string } | null } | null;
  };

  return (data as unknown as Row[]).map((row) => ({
    family_id: row.id,
    family_name: row.name,
    family_code: row.family_code,
    owner_name: row.created_by_user?.full_name ?? '—',
    owner_email: row.created_by_user?.email ?? null,
    plan_name: row.subscription?.plan?.name ?? null,
    plan_key: row.subscription?.plan?.key ?? null,
    created_at: row.created_at,
  }));
}

export interface OwnerDashboardStats {
  totalFamilies: number;
  freeFamilies: number;
  premiumFamilies: number;
  totalPayments: number;
  pendingProviderAmount: number;
}

export async function getOwnerDashboardStats(): Promise<OwnerDashboardStats> {
  const [{ count: totalFamilies }, { count: freeFamilies }, { count: premiumFamilies }, { data: payments }] =
    await Promise.all([
      supabase.from('families').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan', 'free'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan', 'premium'),
      supabase.from('payments').select('amount_net, status'),
    ]);

  const paymentRows = (payments as { amount_net: number; status: string }[]) ?? [];

  return {
    totalFamilies: totalFamilies ?? 0,
    freeFamilies: freeFamilies ?? 0,
    premiumFamilies: premiumFamilies ?? 0,
    totalPayments: paymentRows.length,
    pendingProviderAmount: paymentRows
      .filter((p) => p.status === 'pending_provider')
      .reduce((sum, p) => sum + Number(p.amount_net), 0),
  };
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
