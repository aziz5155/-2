import { supabase } from '@/lib/supabase';
import { Child } from '@/types/models';

/** Uploads a picked photo to the public `avatars` bucket and returns its public URL. */
export async function uploadChildAvatar(familyId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const path = `${familyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: mimeType });
  if (error) throw error;

  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export async function listChildren(familyId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
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
