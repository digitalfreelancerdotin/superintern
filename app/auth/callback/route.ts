import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ensureReferralCode } from '@/app/lib/referral-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('AuthCallback: Processing callback');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('AuthCallback: Error exchanging code for session:', error);
        throw error;
      }

      // Wait for any profile creation/updates to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now try to ensure the referral code exists
      if (data.user) {
        const referralCode = await ensureReferralCode(data.user.id);
        if (!referralCode) {
          console.warn('AuthCallback: Failed to create referral code for user:', data.user.id);
        }
      }

      // Redirect to the specified URL or default to the intern dashboard
      const redirectTo = next || '/dashboard/intern';
      console.log('AuthCallback: Redirecting to:', redirectTo);
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
    } catch (error) {
      console.error('AuthCallback: Error in callback processing:', error);
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
    }
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