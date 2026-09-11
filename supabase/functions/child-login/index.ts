// Two-step child sign-in that never exposes the child's internal email to
// the client:
//   { action: 'list', family_code }               -> public child roster
//   { action: 'signin', family_code, child_id, pin } -> real auth session
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: family } = await admin
      .from('families')
      .select('id, name')
      .eq('family_code', (body.family_code ?? '').toUpperCase())
      .maybeSingle();

    if (!family) return jsonResponse({ error: 'family code not found' }, 404);

    if (body.action === 'list') {
      const { data: children, error } = await admin
        .from('children')
        .select('id, name, avatar_emoji, avatar_url')
        .eq('family_id', family.id)
        .eq('is_active', true);

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ family: { id: family.id, name: family.name }, children });
    }

    if (body.action === 'signin') {
      const { child_id, pin } = body;
      if (!child_id || !pin) return jsonResponse({ error: 'child_id and pin are required' }, 400);

      const { data: child } = await admin
        .from('children')
        .select('internal_email')
        .eq('id', child_id)
        .eq('family_id', family.id)
        .maybeSingle();

      if (!child?.internal_email) return jsonResponse({ error: 'child not found' }, 404);

      const tokenResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: child.internal_email, password: pin }),
      });

      if (!tokenResp.ok) return jsonResponse({ error: 'invalid pin' }, 401);

      const session = await tokenResp.json();
      return jsonResponse({ session });
    }

    return jsonResponse({ error: 'unknown action' }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'unexpected error' }, 500);
  }
});
