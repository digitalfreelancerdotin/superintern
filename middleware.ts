import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Define routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/callback',
  '/auth/reset-password',
];

// Define routes that are always accessible regardless of auth status
const alwaysAccessibleRoutes = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/fonts/',
  '/images/',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not logged in and trying to access protected routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If user is logged in, check if they're active
  if (session && req.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('intern_profiles')
      .select('is_active')
      .eq('user_id', session.user.id)
      .single();

    // If user is inactive and not trying to access the suspended page, redirect them
    if (profile && !profile.is_active && req.nextUrl.pathname !== '/dashboard/suspended') {
      return NextResponse.redirect(new URL('/dashboard/suspended', req.url));
    }
  }

  return res;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/dashboard/:path*'],
}; 