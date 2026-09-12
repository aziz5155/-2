// Lets a parent reset their child's PIN. Updating another user's password
// requires the service role, so this cannot be done from the client.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'missing authorization' }, 401);

    const { child_id, new_pin } = await req.json();
    if (!child_id || !/^\d{4}$/.test(new_pin ?? '')) {
      return jsonResponse({ error: 'child_id and a 4-digit new_pin are required' }, 400);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse({ error: 'invalid session' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: child } = await admin
      .from('children')
      .select('id, user_id, family_id')
      .eq('id', child_id)
      .maybeSingle();

    if (!child?.user_id) return jsonResponse({ error: 'child not found' }, 404);

    const { data: isParent } = await userClient.rpc('is_family_parent', { fam: child.family_id });
    if (!isParent) return jsonResponse({ error: 'not authorized for this family' }, 403);

    const { error: updateErr } = await admin.auth.admin.updateUserById(child.user_id, { password: new_pin });
    if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'unexpected error' }, 500);
  }
});
