'use server';

import { supabaseAdmin } from '../lib/supabase-admin';

export async function adminGetAllProfiles() {
  try {
    // This will bypass RLS and get all profiles
    const { data, error } = await supabaseAdmin
      .from('intern_profiles')
      .select('*');

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    return { error };
  }
}

export async function adminCreateUser(email: string, password: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirms the email
    });

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error };
  }
} 