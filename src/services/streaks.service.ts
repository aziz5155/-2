import { supabase } from '@/lib/supabase';
import { Streak } from '@/types/models';

export async function getStreak(childId: string): Promise<Streak | null> {
  const { data, error } = await supabase.from('streaks').select('*').eq('child_id', childId).maybeSingle();
  if (error) throw error;
  return data as Streak | null;
}
