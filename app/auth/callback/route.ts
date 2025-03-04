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
      console.log('AuthCallback: Creating/updating intern profile for user:', data.user.id);
      const { error: profileError } = await supabase
        .from('intern_profiles')
        .upsert(
          { 
            user_id: data.user.id,
            email: data.user.email,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (profileError) {
        console.error('Intern profile creation error:', profileError);
        // Don't redirect on profile error, just log it
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