// Creates a child login (a real Supabase Auth user under a synthetic
// internal email, with a random password the child never sees — sign-in
// happens passwordlessly via child-login) plus the child's profile row.
// Must run with the service role — creating other users' auth accounts is
// a privileged operation that can never happen from the client.
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

    const { family_id, name, avatar_url, avatar_emoji, birth_year } = await req.json();

    if (!family_id || !name) {
      return jsonResponse({ error: 'family_id and name are required' }, 400);
    }

    // Verify the caller is an authenticated parent of this family (RLS-backed).
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse({ error: 'invalid session' }, 401);

    const { data: isParent } = await userClient.rpc('is_family_parent', { fam: family_id });
    if (!isParent) return jsonResponse({ error: 'not authorized for this family' }, 403);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const internalEmail = `child.${crypto.randomUUID()}@internal.familysuccess.app`;
    // Never surfaced anywhere again — child-login signs children in
    // passwordlessly via a server-generated magic link, not this password.
    const internalPassword = crypto.randomUUID();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: internalEmail,
      password: internalPassword,
      email_confirm: true,
      user_metadata: { kind: 'child', full_name: name },
    });
    if (createErr || !created.user) {
      return jsonResponse({ error: createErr?.message ?? 'failed to create child account' }, 500);
    }

    const { data: child, error: childErr } = await admin
      .from('children')
      .insert({
        family_id,
        user_id: created.user.id,
        internal_email: internalEmail,
        name,
        avatar_url: avatar_url ?? null,
        avatar_emoji: avatar_emoji ?? null,
        birth_year: birth_year ?? null,
      })
      .select()
      .single();

    if (childErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return jsonResponse({ error: childErr.message }, 500);
    }

    return jsonResponse({ child });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'unexpected error' }, 500);
  }
});
