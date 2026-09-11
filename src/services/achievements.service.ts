import { supabase } from '@/lib/supabase';
import { Achievement, ChildAchievement } from '@/types/models';

export async function listAchievementCatalog(): Promise<Achievement[]> {
  const { data, error } = await supabase.from('achievements').select('*').order('sort_order');
  if (error) throw error;
  return data as Achievement[];
}

export async function listChildAchievements(childId: string): Promise<ChildAchievement[]> {
  const { data, error } = await supabase.from('child_achievements').select('*').eq('child_id', childId);
  if (error) throw error;
  return data as ChildAchievement[];
}
