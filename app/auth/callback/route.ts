import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('AuthCallback: Processing callback');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    console.log('AuthCallback: Exchanging code for session');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('AuthCallback: Error:', error);
      return NextResponse.redirect(
        new URL('/auth/login?error=Authentication failed', requestUrl.origin)
      );
    }

    // Ensure intern profile exists
    if (data?.user) {
      console.log('AuthCallback: Checking intern profile for user:', data.user.id);
      
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('intern_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (!existingProfile) {
        console.log('AuthCallback: Profile not found, creating new profile');
        // Profile doesn't exist, create it
        const { error: profileError } = await supabase
          .from('intern_profiles')
          .insert([
            {
              user_id: data.user.id,
              email: data.user.email,
              first_name: data.user.user_metadata?.given_name || '',
              last_name: data.user.user_metadata?.family_name || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('Intern profile creation error:', profileError);
          // Log error but don't redirect - the trigger might have created it
        } else {
          console.log('Intern profile created successfully');
        }
      } else {
        console.log('AuthCallback: Profile exists, updating metadata');
        // Profile exists, update metadata
        const { error: updateError } = await supabase
          .from('intern_profiles')
          .update({
            email: data.user.email,
            first_name: data.user.user_metadata?.given_name || existingProfile.first_name,
            last_name: data.user.user_metadata?.family_name || existingProfile.last_name,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user.id);

        if (updateError) {
          console.error('Intern profile update error:', updateError);
        } else {
          console.log('Intern profile updated successfully');
        }
      }

      // Check if user already has a referral code
      const { data: existingCode, error: fetchError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking referral code:', fetchError);
      }

      // If no referral code exists, create one
      if (!existingCode) {
        const newCode = generateReferralCode();
        const { error: insertError } = await supabase
          .from('referral_codes')
          .insert({
            user_id: data.user.id,
            code: newCode
          });

        if (insertError) {
          console.error('Error creating referral code:', insertError);
        }
      }
    }

    // Redirect to the specified URL or default to the intern dashboard
    const redirectTo = next || '/dashboard/intern';
    console.log('AuthCallback: Redirecting to:', redirectTo);
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  }

  // If no code is present, redirect to login
  console.log('AuthCallback: No code present, redirecting to login');
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}

function generateReferralCode(): string {
  // Generate a random 8-character code with timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).substring(0, 2);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${random}${timestamp}`;
} 