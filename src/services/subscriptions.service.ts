import { supabase } from '@/lib/supabase';
import { Subscription } from '@/types/models';

export const FREE_PLAN_LIMITS = {
  maxChildren: 2,
  maxPrograms: 3,
  maxRewards: 6,
} as const;

export async function getSubscription(familyId: string): Promise<Subscription | null> {
  const { data, error } = await supabase.from('subscriptions').select('*').eq('family_id', familyId).maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
}

export function isPremium(subscription: Subscription | null): boolean {
  return subscription?.plan === 'premium' && subscription.status === 'active';
}
