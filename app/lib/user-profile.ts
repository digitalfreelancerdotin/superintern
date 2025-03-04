import { supabase, RESUMES_BUCKET, validateConnection } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

interface InternProfile {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  github_url?: string;
  resume_url?: string;
  location?: string;
  university?: string;
  major?: string;
  graduation_year?: string;
}

// Helper function to get the Supabase client
async function getSupabaseClient() {
  try {
    console.log('Getting Supabase client...');
    
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials in environment variables', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      });
      throw new Error('Missing Supabase credentials. Please check your environment variables.');
    }
    
    // Validate connection with detailed error handling
    try {
      const isConnected = await validateConnection();
      
      if (!isConnected) {
        console.error('Supabase connection validation failed in getSupabaseClient');
        throw new Error('Database connection failed. Please check your Supabase configuration and connection.');
      }
    } catch (validationError) {
      console.error('Error during connection validation:', validationError);
      throw new Error(`Database connection validation error: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`);
    }
    
    return supabase;
  } catch (error) {
    console.error('Error in getSupabaseClient:', error);
    throw new Error(`Failed to initialize database connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getInternProfile(userId: string) {
  try {
    if (!userId) {
      console.error('getInternProfile called with no userId');
      throw new Error('User ID is required');
    }

    console.log('Fetching profile for user:', userId);

    // Get the appropriate Supabase client
    const client = await getSupabaseClient();

    // First check if the table exists
    try {
      const { error: tableCheckError } = await client
        .from('intern_profiles')
        .select('count')
        .limit(1);
      
      if (tableCheckError) {
        console.error('Table check failed:', tableCheckError);
        
        // Check if the error indicates the table doesn't exist
        if (typeof tableCheckError === 'object' && 
            tableCheckError !== null && 
            'message' in tableCheckError && 
            typeof tableCheckError.message === 'string' && 
            tableCheckError.message.includes('does not exist')) {
          throw new Error('The intern_profiles table does not exist. Please run the SQL setup script in your Supabase dashboard.');
        }
      }
    } catch (tableError) {
      console.error('Error checking if table exists:', tableError);
      throw new Error('Failed to check if the intern_profiles table exists. Please verify your Supabase setup.');
    }

    // Then validate the connection
    const isConnected = await validateConnection().catch((error: unknown) => {
      console.error('Connection validation failed:', error);
      return false;
    });

    if (!isConnected) {
      throw new Error('Database connection failed. Please check your Supabase configuration.');
    }

    // Query the profile with explicit error handling
    console.log('Querying profile with user_id:', userId);
    const { data, error, status, statusText } = await client
      .from('intern_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Profile query response:', { 
      data, 
      error: error ? JSON.stringify(error) : null,
      status, 
      statusText 
    });

    if (error) {
      console.error('Error fetching intern profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        status,
        statusText,
        fullError: JSON.stringify(error)
      });
      throw new Error(`Database query error: ${error.message || 'Unknown database error'}`);
    }

    // If no data found, return null (this is not an error case)
    if (!data) {
      console.log('No profile found for user:', userId);
      return null;
    }

    console.log('Profile found:', data);
    return data;
  } catch (error: unknown) {
    console.error('Error in getInternProfile:', {
      error,
      errorType: error instanceof Error ? 'Error' : typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      fullError: error ? JSON.stringify(error) : 'null'
    });

    // If we got an empty error object, provide a more helpful error message
    if (error && typeof error === 'object' && Object.keys(error).length === 0) {
      console.error('Empty error object detected. This usually indicates a connection issue or missing table.');
      throw new Error('Database connection failed or table does not exist. Please run the SQL setup script in your Supabase dashboard.');
    }

    // Ensure we always throw an Error object
    if (error instanceof Error) {
      throw error;
    }
    
    // Convert unknown error types to Error object
    throw new Error(typeof error === 'string' ? error : 'Unknown error occurred while fetching profile');
  }
}

export async function createOrUpdateInternProfile(profile: InternProfile): Promise<InternProfile> {
  try {
    // Ensure user_id is a string
    if (!profile.user_id) {
      console.error('createOrUpdateInternProfile called with missing user_id');
      throw new Error('User ID is required');
    }

    // Ensure user_id is treated as a string
    const userId = String(profile.user_id);
    console.log('User ID type:', typeof userId);
    console.log('User ID value:', userId);
    
    // Update the profile object to ensure user_id is a string
    profile.user_id = userId;

    // Validate email format
    if (typeof profile.email !== 'string' || !profile.email.includes('@')) {
      console.error('createOrUpdateInternProfile called with invalid email format:', profile.email);
      throw new Error('Valid email address is required');
    }

    console.log('Creating/updating profile for user:', profile.user_id);
    console.log('Profile data:', JSON.stringify(profile, null, 2));

    // Get the appropriate Supabase client
    const client = await getSupabaseClient();

    // First validate the connection
    const isConnected = await validateConnection();
    if (!isConnected) {
      console.error('Connection validation failed in createOrUpdateInternProfile');
      throw new Error('Database connection failed. Please check your Supabase configuration.');
    }

    // Log the update attempt
    console.log('Attempting upsert with data:', {
      user_id: profile.user_id,
      email: profile.email,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      phone_number: profile.phone_number || null,
      github_url: profile.github_url || null,
      location: profile.location || null,
      university: profile.university || null,
      major: profile.major || null,
      graduation_year: profile.graduation_year || null,
      resume_url: profile.resume_url || null
    });

    // Perform the upsert operation with more detailed error handling
    const { data: sessionData } = await client.auth.getSession();
    console.log('Current auth status:', {
      hasSession: !!sessionData?.session,
      userId: sessionData?.session?.user?.id,
      userEmail: sessionData?.session?.user?.email
    });

    const { data, error, status, statusText } = await client
      .from('intern_profiles')
      .upsert({
        user_id: profile.user_id,
        email: profile.email,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        phone_number: profile.phone_number || null,
        github_url: profile.github_url || null,
        location: profile.location || null,
        university: profile.university || null,
        major: profile.major || null,
        graduation_year: profile.graduation_year || null,
        resume_url: profile.resume_url || null
      })
      .select();

    // Log the complete response
    console.log('Supabase response:', {
      data,
      error,
      status,
      statusText,
      hasError: !!error,
      errorDetails: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      } : null
    });

    if (error) {
      console.error('Detailed error information:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status,
        statusText
      });

      // Check for RLS policy violation
      if (error.message?.includes('policy') || error.code === '42501') {
        throw new Error('Permission denied: You do not have permission to update this profile. Please ensure you are properly authenticated.');
      }

      // Check for specific PostgreSQL error codes
      if (error.code === '23505') {
        throw new Error('A profile with this user ID already exists.');
      } else if (error.code === '42P01') {
        throw new Error('The intern_profiles table does not exist. Please run the SQL setup script.');
      } else if (error.code === '42703') {
        throw new Error('Column error: ' + error.message);
      } else if (error.code?.startsWith('22')) {
        throw new Error('Data type error: ' + error.message);
      }

      throw new Error(`Failed to update profile: ${error.message || 'Unknown error occurred'}`);
    }

    // Verify the update by fetching the profile
    const { data: verifyData, error: verifyError } = await client
      .from('intern_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    if (verifyError) {
      console.error('Error verifying profile update:', verifyError);
      throw new Error('Profile update could not be verified');
    }

    if (!verifyData) {
      throw new Error('Profile update failed: No data returned after update');
    }

    console.log('Profile updated and verified:', verifyData);
    return verifyData;

  } catch (error: unknown) {
    // Enhanced error logging
    console.error('Detailed error in createOrUpdateInternProfile:', {
      error,
      errorType: error instanceof Error ? 'Error' : typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      isPostgrestError: error instanceof PostgrestError,
      fullErrorObject: JSON.stringify(error, null, 2)
    });

    // If we got an empty error object, provide more context
    if (error && typeof error === 'object' && Object.keys(error).length === 0) {
      throw new Error('Database operation failed: Empty error response received. This might indicate a network issue or RLS policy violation.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred while updating profile');
  }
}

export async function uploadResume(userId: string, file: File) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    // Get the appropriate Supabase client
    const client = await getSupabaseClient();

    // Create a unique file path using userId and timestamp
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${timestamp}.${fileExt}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await client.storage
      .from(RESUMES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading resume:', uploadError);
      throw new Error(`Failed to upload resume: ${uploadError.message}`);
    }

    // Get the public URL of the uploaded file
    const { data } = client.storage
      .from(RESUMES_BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    // Update the profile with the resume URL
    await createOrUpdateInternProfile({
      user_id: userId,
      email: '', // Required by type but will be merged with existing data
      resume_url: data.publicUrl
    } as InternProfile);

    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadResume:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while uploading resume');
  }
} 