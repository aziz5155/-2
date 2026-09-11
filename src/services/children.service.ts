import { supabase } from '@/lib/supabase';
import { Child } from '@/types/models';

export async function listChildren(familyId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Child[];
}

/** For a child's own session: their profile row (user_id = auth.uid()). */
export async function getMyChildProfile(): Promise<Child> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase.from('children').select('*').eq('user_id', user.id).single();
  if (error) throw error;
  return data as Child;
}

export async function getChild(childId: string): Promise<Child> {
  const { data, error } = await supabase.from('children').select('*').eq('id', childId).single();
  if (error) throw error;
  return data as Child;
}

export async function updateChild(
  childId: string,
  patch: Partial<Pick<Child, 'name' | 'avatar_url' | 'avatar_emoji' | 'birth_year' | 'is_active'>>,
) {
  const { data, error } = await supabase.from('children').update(patch).eq('id', childId).select().single();
  if (error) throw error;
  return data as Child;
}

export async function removeChild(childId: string) {
  const { error } = await supabase.from('children').update({ is_active: false }).eq('id', childId);
  if (error) throw error;
}
