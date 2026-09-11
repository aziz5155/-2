import { supabase } from '@/lib/supabase';
import { ActivityEvent } from '@/types/models';

export interface ActivityEventWithActor extends ActivityEvent {
  actor_name: string | null;
}

export async function listActivity(familyId: string, limit = 30): Promise<ActivityEventWithActor[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*, child:children(name), user:users(full_name)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  type Row = ActivityEvent & { child: { name: string } | null; user: { full_name: string } | null };
  return (data as unknown as Row[]).map((row) => ({
    ...row,
    actor_name: row.child?.name ?? row.user?.full_name ?? null,
  }));
}
