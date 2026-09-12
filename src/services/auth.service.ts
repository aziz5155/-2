import * as AppleAuthentication from 'expo-apple-authentication';

import { callEdgeFunction, supabase } from '@/lib/supabase';
import { AppUser, Child, Family } from '@/types/models';

export async function signUpParent(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { kind: 'parent', full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signInParent(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Confirms the 6-digit code Supabase emailed after signUpParent(). */
export async function verifySignupCode(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
  if (error) throw error;
  return data;
}

export async function resendSignupCode(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

/** Sends a one-time recovery link to the given email (used by "forgot password"). */
export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'familysuccess://reset-password',
  });
  if (error) throw error;
}

/** Exchanges the PKCE code from the recovery deep link for a real (recovery) session. */
export async function exchangeRecoveryCode(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data;
}

export async function setNewPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('Apple sign-in did not return a token');

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  if (fullName) {
    await supabase.auth.updateUser({ data: { full_name: fullName } });
  }

  return data;
}

export async function signInWithGoogleIdToken(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
  if (error) throw error;
  return data as AppUser;
}

export async function createFamily(name: string): Promise<Family> {
  const { data, error } = await supabase.rpc('create_family', { p_name: name });
  if (error) throw error;
  return data as Family;
}

export async function createChild(input: {
  family_id: string;
  name: string;
  pin: string;
  avatar_url?: string;
  avatar_emoji?: string;
  birth_year?: number;
}): Promise<Child> {
  const res = await callEdgeFunction<{ child: Child }>('create-child', input);
  return res.child;
}

export async function resetChildPin(child_id: string, new_pin: string) {
  await callEdgeFunction('reset-child-pin', { child_id, new_pin });
}

export async function listFamilyChildrenByCode(family_code: string) {
  return callEdgeFunction<{ family: { id: string; name: string }; children: Pick<Child, 'id' | 'name' | 'avatar_emoji' | 'avatar_url'>[] }>(
    'child-login',
    { action: 'list', family_code },
  );
}

export async function childSignIn(family_code: string, child_id: string, pin: string) {
  const res = await callEdgeFunction<{ session: { access_token: string; refresh_token: string } }>('child-login', {
    action: 'signin',
    family_code,
    child_id,
    pin,
  });

  const { error } = await supabase.auth.setSession({
    access_token: res.session.access_token,
    refresh_token: res.session.refresh_token,
  });
  if (error) throw error;
}
