import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check if this is a signup page with a referral code
  const { pathname, searchParams } = new URL(req.url);
  if (pathname === '/signup' && searchParams.has('ref')) {
    const referralCode = searchParams.get('ref');
    
    // Verify the referral code exists
    const { data, error } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('referral_code', referralCode)
      .single();

    if (error || !data) {
      // If referral code is invalid, redirect to signup without the code
      return NextResponse.redirect(new URL('/signup', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/signup']
}; 