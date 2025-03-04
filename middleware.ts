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

export async function middleware(request: NextRequest) {
  // Create a Supabase client for the middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Check if the route is always accessible
  const isAlwaysAccessible = alwaysAccessibleRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (isAlwaysAccessible) {
    return res;
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(`${route}/`)
  );
  
  if (isPublicRoute) {
    return res;
  }

  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession();

  // If there's no session and the route is protected, redirect to login
  if (!session) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image).*)',
  ],
}; 