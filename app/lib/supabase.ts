import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging for environment variables
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey?.substring(0, 10) + '...');

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create the main client for general operations
export const supabase = createClientComponentClient({
  supabaseUrl: supabaseUrl,
  supabaseKey: supabaseAnonKey,
});

// Storage bucket for resumes
export const RESUMES_BUCKET = 'resumes';

// Validate connection
export const validateConnection = async () => {
  try {
    console.log('Validating Supabase connection...');
    
    // Check if environment variables are properly set
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials in environment variables');
      return false;
    }
    
    // First check if we can connect to Supabase at all
    console.log('Checking basic connection...');
    try {
      // Try a simple auth check first - this is more reliable
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Auth check failed:', authError);
        return false;
      }
      
      console.log('Auth check succeeded, session:', authData?.session ? 'exists' : 'null');
      
      // Then try a simple query to check database access
      const { data: healthData, error: healthError } = await supabase
        .from('intern_profiles')
        .select('count')
        .limit(1);
      
      if (healthError) {
        console.error('Health check failed:', {
          code: healthError.code,
          message: healthError.message,
          details: healthError.details
        });
        
        // If the error is about the table not existing, that's a different issue
        if (healthError.message?.includes('does not exist')) {
          console.error('The intern_profiles table does not exist. Please run the SQL setup script.');
          return false;
        }
        
        // Try a different approach - just check if we can access any system info
        try {
          const { data: systemData, error: systemError } = await supabase
            .from('_prisma_migrations')
            .select('count')
            .limit(1)
            .maybeSingle();
            
          if (systemError && !systemError.message?.includes('does not exist')) {
            console.error('System table check failed:', systemError);
            return false;
          }
        } catch (systemCheckError) {
          console.error('System check threw an exception:', systemCheckError);
          // Continue anyway - this is just an additional check
        }
      } else {
        console.log('Health check succeeded:', healthData);
      }
    } catch (healthCheckError) {
      console.error('Health check threw an exception:', healthCheckError);
      return false;
    }

    // Test the connection by making a simple query
    console.log('Testing query capability...');
    try {
      const { data, error, status, statusText } = await supabase
        .from('intern_profiles')
        .select('count')
        .limit(1);

      console.log('Connection test response:', {
        data,
        error,
        status,
        statusText,
        hasData: !!data,
        errorDetails: error ? {
          code: error.code,
          message: error.message,
          details: error.details
        } : null
      });

      if (error) {
        console.error('Supabase connection validation failed:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        
        // If the error is about the table not existing, we can still consider the connection valid
        if (error.message?.includes('does not exist')) {
          console.warn('The intern_profiles table does not exist, but connection is valid.');
          return true;
        }
        
        return false;
      }
      
    } catch (queryError) {
      console.error('Query test threw an exception:', queryError);
      return false;
    }

    // Also test storage access
    console.log('Testing storage access...');
    try {
      const { data: buckets, error: storageError } = await supabase
        .storage
        .listBuckets();

      if (storageError) {
        console.error('Storage access test failed:', {
          message: storageError.message,
          name: storageError.name
        });
        // Don't fail the connection test just because storage failed
        // We'll handle storage issues separately
        console.warn('Storage access failed but continuing with database connection');
      } else {
        console.log('Storage buckets:', buckets);
        
        // Check if the resumes bucket exists
        const resumesBucketExists = buckets?.some(bucket => bucket.name === RESUMES_BUCKET);
        if (!resumesBucketExists) {
          console.warn(`The '${RESUMES_BUCKET}' bucket does not exist. Will attempt to create it during initialization.`);
        }
      }
    } catch (storageError) {
      console.error('Storage test threw an exception:', storageError);
      // Don't fail the connection test just because storage failed
      console.warn('Storage access failed but continuing with database connection');
    }

    console.log('Supabase connection validation successful');
    return true;
  } catch (error) {
    console.error('Unexpected error during connection validation:', error);
    return false;
  }
};

// Initialize storage bucket
export const initStorage = async () => {
  try {
    // Validate connection first
    const isConnected = await validateConnection();
    if (!isConnected) {
      throw new Error('Cannot initialize storage: Database connection failed');
    }

    // First check if bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      console.error('Error listing buckets:', {
        message: listError.message,
        name: listError.name
      });
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === RESUMES_BUCKET);

    if (!bucketExists) {
      console.log('Creating new resumes bucket...');
      const { data, error } = await supabase.storage.createBucket(RESUMES_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      });
      
      if (error) {
        console.error('Error creating bucket:', {
          message: error.message,
          name: error.name
        });
        throw new Error(`Failed to create bucket: ${error.message}`);
      }

      console.log('Created resumes bucket:', data);
    } else {
      console.log('Resumes bucket already exists');
    }

    // Update bucket settings even if it exists
    console.log('Updating bucket settings...');
    const { error: updateError } = await supabase.storage.updateBucket(RESUMES_BUCKET, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });

    if (updateError) {
      console.error('Error updating bucket settings:', {
        message: updateError.message,
        name: updateError.name
      });
      throw new Error(`Failed to update bucket settings: ${updateError.message}`);
    }

    // Verify bucket access
    console.log('Verifying bucket access...');
    const { error: accessError } = await supabase
      .storage
      .from(RESUMES_BUCKET)
      .list();

    if (accessError) {
      console.error('Error verifying bucket access:', {
        message: accessError.message,
        name: accessError.name
      });
      throw new Error(`Failed to verify bucket access: ${accessError.message}`);
    }

    console.log('Storage initialization completed successfully');
    return true;

  } catch (error) {
    console.error('Error in initStorage:', {
      error,
      errorType: error instanceof Error ? 'Error' : typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Get a client with the user's auth session
export const getSupabaseClient = async () => {
  try {
    console.log('Getting Supabase client with auth session...');
    
    // Check if environment variables are properly set
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials in environment variables');
      throw new Error('Missing Supabase credentials. Please check your environment variables.');
    }
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    console.log('Session retrieved:', session ? 'exists' : 'null');
    
    if (!session) {
      console.warn('No active session found. User is not authenticated.');
      // Return the regular client, but operations will be subject to RLS
      return supabase;
    }
    
    // Log the user ID for debugging
    console.log('Authenticated user ID:', session.user.id);
    console.log('User ID type:', typeof session.user.id);
    
    // Return the client with the session
    return supabase;
  } catch (error) {
    console.error('Error in getSupabaseClient:', error);
    throw error;
  }
};

export const createClient = () => {
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}; 