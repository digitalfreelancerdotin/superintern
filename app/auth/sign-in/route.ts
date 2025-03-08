import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Could not authenticate user`,
      {
        // a 301 status is required to redirect from a POST to a GET route
        status: 301,
      }
    );
  }

  // Check and create referral code if needed
  if (user) {
    const { data: existingCode, error: fetchError } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking referral code:', fetchError);
    }

    if (!existingCode) {
      const newCode = generateReferralCode();
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: newCode
        });

      if (insertError) {
        console.error('Error creating referral code:', insertError);
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin, {
    // a 301 status is required to redirect from a POST to a GET route
    status: 301,
  });
}

function generateReferralCode(): string {
  // Generate a random 8-character code with timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).substring(0, 2);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${random}${timestamp}`;
} 