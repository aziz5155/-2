export type AdminRole = 'owner' | 'admin' | 'support' | 'marketing' | 'finance';

export interface AdminUser {
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'free' | 'plus' | 'pro';
export type BillingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PromoStatus = 'active' | 'paused' | 'archived';
export type PaymentStatus = 'pending_provider' | 'succeeded' | 'failed' | 'refunded';

export interface Plan {
  id: string;
  key: string;
  name: string;
  tier: SubscriptionTier;
  billing_period: BillingPeriod | null;
  price_amount: number;
  price_currency: string;
  trial_days: number;
  max_children: number | null;
  max_programs: number | null;
  max_rewards: number | null;
  features: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  starts_at: string;
  ends_at: string | null;
  applies_to_first_n_payments: number | null;
  max_redemptions: number | null;
  max_redemptions_per_customer: number;
  times_redeemed: number;
  status: PromoStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeRedemption {
  id: string;
  promo_code_id: string;
  family_id: string;
  redeemed_by: string | null;
  plan_id: string;
  payment_number: number;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  family_id: string;
  plan_id: string;
  promo_code_id: string | null;
  payment_number: number;
  amount_gross: number;
  amount_discount: number;
  amount_net: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_reference: string | null;
  created_at: string;
}

export interface AdminAuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface PromoValidationResult {
  is_valid: boolean;
  message: string;
  discount_percent: number | null;
  original_amount: number | null;
  final_amount: number | null;
}
