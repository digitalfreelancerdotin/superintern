import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a Supabase client that uses the Clerk JWT for server-side requests
export async function createClerkSupabaseClient() {
  const authInstance = await auth();
  const clerkToken = await authInstance.getToken({ template: 'supabase' });
  
  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
    global: {
      fetch: async (url, options = {}) => {
        // Add the Clerk JWT to the request headers
        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`);
        }
        
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
} 