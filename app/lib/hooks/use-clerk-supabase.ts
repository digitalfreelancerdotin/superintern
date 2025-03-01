'use client';

import { useAuth } from '@clerk/nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export function useClerkSupabase() {
  const { getToken } = useAuth();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const createSupabaseClient = async () => {
      try {
        // Create a Supabase client with Clerk authentication
        const client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
          global: {
            fetch: async (url, options = {}) => {
              const clerkToken = await getToken({ template: 'supabase' });
              
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
        
        setSupabase(client);
        setLoading(false);
      } catch (err) {
        console.error('Error creating Supabase client:', err);
        setError(err instanceof Error ? err : new Error('Failed to create Supabase client'));
        setLoading(false);
      }
    };

    createSupabaseClient();
  }, [getToken]);

  return { supabase, loading, error };
} 