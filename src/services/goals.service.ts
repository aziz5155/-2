import { supabase } from '@/lib/supabase';
import { Goal } from '@/types/models';

export async function listGoals(childId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Goal[];
}

export async function createGoal(childId: string, familyId: string, name: string, icon: string, targetPoints: number): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({ child_id: childId, family_id: familyId, name, icon, target_points: targetPoints })
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(goalId: string) {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (error) throw error;
}
