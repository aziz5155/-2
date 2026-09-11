import { supabase } from '@/lib/supabase';
import { Reward, RewardRedemption } from '@/types/models';

export type NewRewardInput = Omit<
  Reward,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active' | 'times_redeemed'
>;

export async function listRewards(familyId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('cost_points', { ascending: true });
  if (error) throw error;
  return data as Reward[];
}

export async function createReward(input: NewRewardInput): Promise<Reward> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('rewards')
    .insert({ ...input, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Reward;
}

export async function updateReward(rewardId: string, patch: Partial<NewRewardInput>) {
  const { data, error } = await supabase.from('rewards').update(patch).eq('id', rewardId).select().single();
  if (error) throw error;
  return data as Reward;
}

export async function deleteReward(rewardId: string) {
  const { error } = await supabase.from('rewards').update({ is_active: false }).eq('id', rewardId);
  if (error) throw error;
}

export async function requestRedemption(rewardId: string): Promise<RewardRedemption> {
  const { data, error } = await supabase.rpc('request_redemption', { p_reward_id: rewardId });
  if (error) throw error;
  return data as RewardRedemption;
}

export async function decideRedemption(redemptionId: string, approve: boolean, note?: string): Promise<RewardRedemption> {
  const { data, error } = await supabase.rpc('decide_redemption', {
    p_redemption_id: redemptionId,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data as RewardRedemption;
}

export async function listChildRedemptions(childId: string): Promise<RewardRedemption[]> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('*')
    .eq('child_id', childId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data as RewardRedemption[];
}

export interface PendingRedemption extends RewardRedemption {
  reward_name: string;
  reward_icon: string;
  child_name: string;
}

export async function listPendingRedemptions(familyId: string): Promise<PendingRedemption[]> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('*, reward:rewards(name, icon), child:children(name)')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });
  if (error) throw error;

  type Row = RewardRedemption & { reward: { name: string; icon: string }; child: { name: string } };
  return (data as unknown as Row[]).map((row) => ({
    ...row,
    reward_name: row.reward.name,
    reward_icon: row.reward.icon,
    child_name: row.child.name,
  }));
}
