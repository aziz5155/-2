import { supabase } from '@/lib/supabase';
import { PointTransaction } from '@/types/models';

export async function listChildTransactions(childId: string, limit = 50): Promise<PointTransaction[]> {
  const { data, error } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as PointTransaction[];
}

export async function awardPoints(childId: string, amount: number, reason: string): Promise<PointTransaction> {
  const { data, error } = await supabase.rpc('award_points', {
    p_child_id: childId,
    p_amount: amount,
    p_reason: reason,
  });
  if (error) throw error;
  return data as PointTransaction;
}

export async function deductPoints(childId: string, amount: number, reason: string): Promise<PointTransaction> {
  const { data, error } = await supabase.rpc('deduct_points', {
    p_child_id: childId,
    p_amount: amount,
    p_reason: reason,
  });
  if (error) throw error;
  return data as PointTransaction;
}

export const QUICK_POINT_AMOUNTS = [5, 10, 20, 50] as const;

export interface WeeklyComparison {
  thisWeek: number;
  lastWeek: number;
}

export async function getWeeklyPointsComparison(childId: string): Promise<WeeklyComparison> {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const { data, error } = await supabase
    .from('point_transactions')
    .select('amount, created_at')
    .eq('child_id', childId)
    .gte('created_at', startOfLastWeek.toISOString())
    .gt('amount', 0);
  if (error) throw error;

  let thisWeek = 0;
  let lastWeek = 0;
  for (const tx of data as { amount: number; created_at: string }[]) {
    const date = new Date(tx.created_at);
    if (date >= startOfThisWeek) thisWeek += tx.amount;
    else lastWeek += tx.amount;
  }
  return { thisWeek, lastWeek };
}
