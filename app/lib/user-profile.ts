import { supabase, RESUMES_BUCKET, validateConnection } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

export async function createOrUpdateInternProfile(profile: InternProfile) {
  const supabase = createClientComponentClient();
  
  try {
    // Validate user_id
    if (!profile.user_id) {
      throw new Error('User ID is required');
    }

    // Get the current user's email and existing profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Get existing profile data
    const { data: existingProfile } = await supabase
      .from('intern_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    // Merge existing data with new data, preserving existing values if not provided
    const updatedProfile = {
      user_id: profile.user_id,
      email: user.email,
      first_name: profile.first_name ?? existingProfile?.first_name ?? null,
      last_name: profile.last_name ?? existingProfile?.last_name ?? null,
      phone_number: profile.phone_number ?? existingProfile?.phone_number ?? null,
      github_url: profile.github_url ?? existingProfile?.github_url ?? null,
      resume_url: profile.resume_url ?? existingProfile?.resume_url ?? null,
      location: profile.location ?? existingProfile?.location ?? null,
      university: profile.university ?? existingProfile?.university ?? null,
      major: profile.major ?? existingProfile?.major ?? null,
      graduation_year: profile.graduation_year ?? existingProfile?.graduation_year ?? null,
      updated_at: new Date().toISOString()
    };

    // Create or update the profile
    const { error } = await supabase
      .from('intern_profiles')
      .upsert(updatedProfile, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createOrUpdateInternProfile:', error);
    return { success: false, error };
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