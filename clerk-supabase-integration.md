# Clerk-Supabase Integration Guide

This guide explains how we've integrated Clerk authentication with Supabase database access in our application.

## Overview

The integration allows us to:
1. Use Clerk for authentication and user management
2. Use Supabase for database and storage
3. Securely connect the two systems using JWT tokens
4. Apply Row Level Security (RLS) in Supabase based on the Clerk user ID

## Key Components

### 1. JWT Template in Clerk

We've created a JWT template in the Clerk dashboard that:
- Is named `supabase`
- Uses the HS256 signing algorithm
- Uses the Supabase JWT secret as the signing key

### 2. Supabase RLS Function

We've created a SQL function in Supabase that extracts the user ID from the JWT:

```sql
CREATE OR REPLACE FUNCTION requesting_user_id() 
RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;
```

### 3. Supabase RLS Policies

We've updated our RLS policies to use this function:

```sql
CREATE POLICY "Users can create their own profile" ON intern_profiles
    FOR INSERT WITH CHECK (user_id = requesting_user_id());

CREATE POLICY "Users can update their own profile" ON intern_profiles
    FOR UPDATE USING (user_id = requesting_user_id())
    WITH CHECK (user_id = requesting_user_id());
```

### 4. Clerk-Supabase Client

We've created a custom Supabase client that includes the Clerk JWT in requests:

```typescript
// Server-side client
export async function createClerkSupabaseClient() {
  const authInstance = await auth();
  const clerkToken = await authInstance.getToken({ template: 'supabase' });
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
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

// Client-side hook
export function useClerkSupabase() {
  const { getToken } = useAuth();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  
  useEffect(() => {
    const client = createClientComponentClerkSupabaseClient(getToken);
    setSupabaseClient(client);
  }, [getToken]);

  return { supabase: supabaseClient };
}
```

## How It Works

1. When a user logs in with Clerk, they receive a session
2. When our app needs to access Supabase, it:
   - Requests a JWT from Clerk using the `supabase` template
   - Adds this JWT to the Authorization header for Supabase requests
3. Supabase validates the JWT and extracts the user ID
4. RLS policies use this user ID to restrict access to data

## Usage in Code

### Server-Side (Server Components/API Routes)

```typescript
import { createClerkSupabaseClient } from '@/lib/clerk-supabase';

export async function getData() {
  const supabase = await createClerkSupabaseClient();
  const { data } = await supabase.from('intern_profiles').select('*');
  return data;
}
```

### Client-Side (Client Components)

```typescript
import { useClerkSupabase } from '@/lib/hooks/use-clerk-supabase';

export function ProfileComponent() {
  const { supabase } = useClerkSupabase();
  
  useEffect(() => {
    if (supabase) {
      supabase.from('intern_profiles').select('*').then(({ data }) => {
        // Use data
      });
    }
  }, [supabase]);
  
  return <div>Profile Component</div>;
}
```

## Troubleshooting

If you encounter issues with the integration:

1. Check that the JWT template in Clerk is correctly configured
2. Verify that the Supabase JWT secret is correctly set in the Clerk template
3. Ensure the RLS policies are correctly set up in Supabase
4. Check browser console for any JWT-related errors
5. Verify that the user ID in Clerk matches the user_id in your Supabase tables 