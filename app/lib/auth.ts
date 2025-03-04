import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type User, type Session } from '@supabase/supabase-js';

// Create a Supabase client for use in the browser
export const supabaseAuth = createClientComponentClient();

// Sign in with magic link
export async function signInWithMagicLink(email: string) {
  // Get the site URL from environment variable
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectTo = `${siteUrl}/auth/callback`;
  
  console.log('Magic link redirect URL:', redirectTo);
  
  const { data, error } = await supabaseAuth.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true, data };
}

// Sign up with email
export async function signUpWithEmail(email: string, password: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectTo = `${siteUrl}/auth/callback`;
  
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true, data };
}

// Sign out
export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true };
}

// Get current session
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabaseAuth.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  
  return data.session;
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabaseAuth.auth.getUser();
  
  if (error || !data?.user) {
    return null;
  }
  
  return data.user;
}

// Handle auth state change
export function onAuthStateChange(callback: (event: any, session: Session | null) => void) {
  return supabaseAuth.auth.onAuthStateChange(callback);
}

// Reset password
export async function resetPassword(email: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectTo = `${siteUrl}/auth/reset-password`;
  
  const { data, error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true, data };
} 