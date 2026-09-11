import { supabase } from '@/lib/supabase';
import { Challenge, ChallengeMember } from '@/types/models';

export type NewChallengeInput = Omit<Challenge, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>;

export async function listChallenges(familyId: string): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data as Challenge[];
}

export async function createChallenge(input: NewChallengeInput): Promise<Challenge> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('challenges')
    .insert({ ...input, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Challenge;
}

export async function joinChallenge(challengeId: string): Promise<ChallengeMember> {
  const { data, error } = await supabase.rpc('join_challenge', { p_challenge_id: challengeId });
  if (error) throw error;
  return data as ChallengeMember;
}

export async function listChallengeMembers(challengeId: string): Promise<ChallengeMember[]> {
  const { data, error } = await supabase.from('challenge_members').select('*').eq('challenge_id', challengeId);
  if (error) throw error;
  return data as ChallengeMember[];
}
