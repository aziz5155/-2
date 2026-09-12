import { supabase } from '@/lib/supabase';

/** Fire-and-forget: called once per app session so DAU/WAU/MAU have something real to count. */
export function logAppOpen(): void {
  supabase.rpc('log_app_open').then(
    () => {},
    () => {},
  );
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FamilyInsightsSummary {
  completed_count: number;
  points_earned: number;
  points_spent: number;
  rewards_redeemed: number;
  active_days: number;
}

export async function getFamilyInsights(familyId: string, range: DateRange): Promise<FamilyInsightsSummary> {
  const { data, error } = await supabase
    .rpc('family_insights_summary', { p_family_id: familyId, p_start: range.start, p_end: range.end })
    .single();
  if (error) throw error;
  return data as FamilyInsightsSummary;
}

export interface ChildAnalytics {
  completions_recorded: number;
  completions_approved: number;
  completion_rate: number | null;
  points_earned: number;
  points_spent: number;
  rewards_redeemed: number;
  most_missed_tasks: { title: string; miss_count: number }[];
  most_consistent_program: { name: string; completed_count: number } | null;
  points_by_reason: { reason: string; total: number }[];
}

export async function getChildAnalytics(childId: string, range: DateRange): Promise<ChildAnalytics> {
  const { data, error } = await supabase
    .rpc('child_analytics', { p_child_id: childId, p_start: range.start, p_end: range.end })
    .single();
  if (error) throw error;
  return data as ChildAnalytics;
}
