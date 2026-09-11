import { supabase } from '@/lib/supabase';
import { Family, FamilyMember } from '@/types/models';

/** Returns the family the current user belongs to (MVP: one family per user). */
export async function getMyFamily(): Promise<Family | null> {
  const { data, error } = await supabase.from('families').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data as Family | null;
}

export async function getFamilyMembers(familyId: string): Promise<(FamilyMember & { user: { full_name: string; avatar_url: string | null } })[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*, user:users(full_name, avatar_url)')
    .eq('family_id', familyId);
  if (error) throw error;
  return data as unknown as (FamilyMember & { user: { full_name: string; avatar_url: string | null } })[];
}
