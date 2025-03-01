# tables and buckets already created
CREATE TABLE intern_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,  -- This will link to Clerk's user ID
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    github_url VARCHAR(255),
    resume_url VARCHAR(255),  -- We'll store the URL of the uploaded file
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

# requirements
1. Create user to user table
After a user sign-in via Clerk, we should get the userId from Clerk and check if this userId exists in the profiles table, matching user_id.
If the user doesn't exist, then create a user in the profiles table.
If the user exists already, then proceed and pass on user_id to functions like generate emojis.
Upload emoji to emojis Supabase storage bucket

2. Upload resumes to "Resumes" supabase storage bucket
When a user uploads a resume, upload the resume file to the Supabase "emojis" storage bucket.
Add a row to the "user" table where the resume URL is stored in "resume_url", and creator_user_id should be the actual user_id.

# Documentation
## Example of uploading files to supabase
import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// Upload file using standard upload
async function uploadFile(file) {
  const { data, error } = await supabase.storage.from('bucket_name').upload('file_path', file)
  if (error) {
    // Handle error
  } else {
    // Handle success
  }
}

NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

2. Clerk middelware documentation
Create a middleware.ts file at the root of your project, or in your src/ directory if you have one.

import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

By default, clerkMiddleware will not protect any routes. All routes are public and you must opt-in to protection for routes.

createRouteMatcher()
createRouteMatcher() is a Clerk helper function that allows you to protect multiple routes. createRouteMatcher() accepts an array of routes and checks if the route the user is trying to visit matches one of the routes passed to it. The paths provided to this helper can be in the same format as the paths provided to the Next Middleware matcher.

The createRouteMatcher() helper returns a function that, if called with the req object from the Middleware, will return true if the user is trying to access a route that matches one of the routes passed to createRouteMatcher().

In the following example, createRouteMatcher() sets all /dashboard and /forum routes as protected routes.

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])


Protect API routes
You can protect routes using either or both of the following:

Authentication-based protection: Verify if the user is signed in.
Authorization-based protection: Verify if the user has the required organization roles or custom permissions.
Protect routes based on authentication status
You can protect routes based on a user's authentication status by checking if the user is signed in.

There are two methods that you can use:

Use auth.protect() if you want to redirect unauthenticated users to the sign-in route automatically.
Use auth().userId if you want more control over what your app does based on user authentication status.



import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  if (!userId && isProtectedRoute(req)) {
    // Add custom logic to run before redirecting

    return redirectToSignIn()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


Protect routes based on authorization status
You can protect routes based on a user's authorization status by checking if the user has the required roles or permissions.

There are two methods that you can use:

Use auth.protect() if you want Clerk to return a 404 if the user does not have the role or permission.
Use auth().has() if you want more control over what your app does based on the authorization status.


import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Restrict admin routes to users with specific permissions
  if (isProtectedRoute(req)) {
    await auth.protect((has) => {
      return has({ permission: 'org:admin:example1' }) || has({ permission: 'org:admin:example2' })
    })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


Using has() on the server-side to check permissions works only with custom permissions, as system permissions aren't included in auth.sessionClaims.orgs_permissions. To check system permissions, verify the user's role instead.


import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { has, redirectToSignIn } = await auth()
  // Restrict admin routes to users with specific permissions
  if (
    (isProtectedRoute(req) && !has({ permission: 'org:admin:example1' })) ||
    !has({ permission: 'org:admin:example2' })
  ) {
    // Add logic to run if the user does not have the required permissions

    return redirectToSignIn()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


Protect multiple groups of routes
You can use more than one createRouteMatcher() in your application if you have two or more groups of routes.

The following example uses the has() method from the auth() helper.


import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isTenantRoute = createRouteMatcher(['/organization-selector(.*)', '/orgid/(.*)'])

const isTenantAdminRoute = createRouteMatcher(['/orgId/(.*)/memberships', '/orgId/(.*)/domain'])

export default clerkMiddleware(async (auth, req) => {
  // Restrict admin routes to users with specific permissions
  if (isTenantAdminRoute(req)) {
    await auth.protect((has) => {
      return has({ permission: 'org:admin:example1' }) || has({ permission: 'org:admin:example2' })
    })
  }
  // Restrict organization routes to signed in users
  if (isTenantRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


Protect all routes
To protect all routes in your application and define specific routes as public, you can use any of the above methods and simply invert the if condition.

middleware.ts


import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


Debug your Middleware
If you are having issues getting your Middleware dialed in, or are trying to narrow down auth-related issues, you can use the debugging feature in clerkMiddleware(). Add { debug: true } to clerkMiddleware() and you will get debug logs in your terminal.

import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware(
  (auth, req) => {
    // Add your middleware checks
  },
  { debug: true },
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


Combine Middleware
You can combine other Middleware with Clerk's Middleware by returning the second Middleware from clerkMiddleware().

middleware.ts

import { clerkMiddleware, createRouteMatcher, redirectToSignIn } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'

import { AppConfig } from './utils/AppConfig'

const intlMiddleware = createMiddleware({
  locales: AppConfig.locales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
})

const isProtectedRoute = createRouteMatcher(['dashboard/(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()

  return intlMiddleware(req)
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


clerkMiddleware() options
The clerkMiddleware() function accepts an optional object. The following options are available:

audience?
string | string[]
A string or list of audiences. If passed, it is checked against the aud claim in the token.

authorizedParties?
string[]
An allowlist of origins to verify against, to protect your application from the subdomain cookie leaking attack. For example: ['http://localhost:3000', 'https://example.com']

clockSkewInMs?
number
Specifies the allowed time difference (in milliseconds) between the Clerk server (which generates the token) and the clock of the user's application server when validating a token. Defaults to 5000 ms (5 seconds).

domain?
string
The domain used for satellites to inform Clerk where this application is deployed.

isSatellite?
boolean
When using Clerk's satellite feature, this should be set to true for secondary domains.

jwtKey
string
Used to verify the session token in a networkless manner. Supply the JWKS Public Key from the API keys page in the Clerk Dashboard. It's recommended to use the environment variable instead. For more information, refer to Manual JWT verification.

organizationSyncOptions?
OrganizationSyncOptions | undefined
Used to activate a specific organization or personal account based on URL path parameters. If there's a mismatch between the active organization in the session (e.g., as reported by auth()) and the organization indicated by the URL, the middleware will attempt to activate the organization specified in the URL.

proxyUrl?
string
Specify the URL of the proxy, if using a proxy.

signInUrl
string
The full URL or path to your sign-in page. Needs to point to your primary application on the client-side. Required for a satellite application in a development instance. It's recommended to use the environment variable instead.

signUpUrl
string
The full URL or path to your sign-up page. Needs to point to your primary application on the client-side. Required for a satellite application in a development instance. It's recommended to use the environment variable instead.

publishableKey
string
The Clerk Publishable Key for your instance. This can be found on the API keys page in the Clerk Dashboard.

secretKey?
string
The Clerk Secret Key for your instance. This can be found on the API keys page in the Clerk Dashboard. The CLERK_ENCRYPTION_KEY environment variable must be set when providing secretKey as an option, refer to Dynamic keys.

It's also possible to dynamically set options based on the incoming request:

import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware(
  (auth, req) => {
    // Add your middleware checks
  },
  (req) => ({
    // Provide `domain` based on the request host
    domain: req.nextUrl.host,
  }),
)

Dynamic keys
Note

Dynamic keys are not accessible on the client-side.

The following options, known as "Dynamic Keys," are shared to the Next.js application server through clerkMiddleware, enabling access by server-side helpers like auth():

signUpUrl
signInUrl
secretKey
publishableKey
Dynamic keys are encrypted and shared during request time using a AES encryption algorithm. When providing a secretKey, the CLERK_ENCRYPTION_KEY environment variable is mandatory and used as the encryption key. If no secretKey is provided to clerkMiddleware, the encryption key defaults to CLERK_SECRET_KEY.

When providing CLERK_ENCRYPTION_KEY, it is recommended to use a 32-byte (256-bit), pseudorandom value. You can use openssl to generate a key:

openssl rand --hex 32

import { clerkMiddleware } from '@clerk/nextjs/server'

// You would typically fetch these keys from a external store or environment variables.
const tenantKeys = {
  tenant1: { publishableKey: 'pk_tenant1...', secretKey: 'sk_tenant1...' },
  tenant2: { publishableKey: 'pk_tenant2...', secretKey: 'sk_tenant2...' },
}

export default clerkMiddleware(
  (auth, req) => {
    // Add your middleware checks
  },
  (req) => {
    // Resolve tenant based on the request
    const tenant = getTenant(req)
    return tenantKeys[tenant]
  },
)

OrganizationSyncOptions
The organizationSyncOptions property on the clerkMiddleware() options object has the type OrganizationSyncOptions, which has the following properties:

organizationPatterns
Pattern[]
Specifies URL patterns that are organization-specific, containing an organization ID or slug as a path parameter. If a request matches this path, the organization identifier will be used to set that org as active.

If the route also matches the personalAccountPatterns prop, this prop takes precedence.

Patterns must have a path parameter named either :id (to match a Clerk organization ID) or :slug (to match a Clerk organization slug).

Warning

If the organization can't be activated—either because it doesn't exist or the user lacks access—the previously active organization will remain unchanged. Components must detect this case and provide an appropriate error and/or resolution pathway, such as calling notFound() or displaying an <OrganizationSwitcher />.


Common examples:

["/orgs/:slug", "/orgs/:slug/(.*)"]
["/orgs/:id", "/orgs/:id/(.*)"]
["/app/:any/orgs/:slug", "/app/:any/orgs/:slug/(.*)"]
personalAccountPatterns
Pattern[]
URL patterns for resources that exist within the context of a Clerk Personal Account (user-specific, outside any organization).

If the route also matches the organizationPattern prop, the organizationPattern prop takes precedence.

Common examples:

["/me", "/me/(.*)"]
["/user/:any", "/user/:any/(.*)"]
Pattern
A Pattern is a string that represents the structure of a URL path. In addition to any valid URL, it may include:

Named path parameters prefixed with a colon (e.g., :id, :slug, :any).
Wildcard token, (.*), which matches the remainder of the path.
Examples
/orgs/:slug
URL	Matches	:slug value
/orgs/acmecorp	✅	acmecorp
/orgs	❌	n/a
/orgs/acmecorp/settings	❌	n/a
/app/:any/orgs/:id
URL	Matches	:id value
/app/petstore/orgs/org_123	✅	org_123
/app/dogstore/v2/orgs/org_123	❌	n/a
/personal-account/(.*)
URL	Matches
/personal-account/settings	✅
/personal-account	❌

Another link on how to intergrate supabase with clerk
https://clerk.com/docs/integrations/databases/supabase

-- Create a function to get the user ID from the JWT
create or replace function requesting_user_id() 
returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ language sql stable;

-- Create a policy that uses this function
create policy "Users can only access their own data"
  on intern_profiles
  for all
  using (user_id = requesting_user_id());