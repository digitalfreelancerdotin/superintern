import { supabase, RESUMES_BUCKET, validateConnection } from './supabase';
import { createClerkSupabaseClient } from './clerk-supabase-server';
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

// Helper function to get the appropriate Supabase client
// For server components, use the Clerk-authenticated client
// For client components or when no auth is needed, use the regular client
async function getSupabaseClient(useClerkAuth = true) {
  if (useClerkAuth) {
    try {
      return await createClerkSupabaseClient();
    } catch (error) {
      console.error('Failed to create Clerk-authenticated Supabase client:', error);
      console.warn('Falling back to anonymous Supabase client');
      return supabase;
    }
  }
  return supabase;
}

export async function getInternProfile(userId: string, useClerkAuth = true) {
  try {
    if (!userId) {
      console.error('getInternProfile called with no userId');
      throw new Error('User ID is required');
    }

    console.log('Fetching profile for user:', userId);

    // Get the appropriate Supabase client
    const client = await getSupabaseClient(useClerkAuth);

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

export async function createOrUpdateInternProfile(profile: InternProfile, useClerkAuth = true) {
  try {
    if (!profile.user_id) {
      console.error('createOrUpdateInternProfile called with no user_id');
      throw new Error('User ID is required');
    }

    if (!profile.email) {
      console.error('createOrUpdateInternProfile called with no email');
      throw new Error('Email is required');
    }

    console.log('Creating/updating profile for user:', profile.user_id);
    console.log('Profile data:', JSON.stringify(profile, null, 2));

    // Get the appropriate Supabase client
    const client = await getSupabaseClient(useClerkAuth);

    // First validate the connection
    const isConnected = await validateConnection().catch((error: unknown) => {
      console.error('Connection validation failed in createOrUpdateInternProfile:', error);
      return false;
    });

    if (!isConnected) {
      throw new Error('Database connection failed. Please check your Supabase configuration.');
    }

    // Check if profile exists
    console.log('Checking if profile exists...');
    const { data: existingProfile, error: fetchError, status: fetchStatus } = await client
      .from('intern_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    console.log('Fetch profile result:', { existingProfile, fetchError, fetchStatus });

    if (fetchError) {
      console.error('Error fetching existing profile:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        status: fetchStatus
      });
      throw new Error(`Failed to check existing profile: ${fetchError.message}`);
    }

    if (!existingProfile) {
      // Create new profile
      console.log('Creating new profile...');
      const { data, error, status } = await client
        .from('intern_profiles')
        .insert([{
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
        }])
        .select()
        .single();

      console.log('Insert result:', { data, error, status });

      if (error) {
        console.error('Error creating intern profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          status
        });
        throw new Error(`Failed to create profile: ${error.message}`);
      }

      console.log('Profile created successfully:', data);
      return data;
    } else {
      // Update existing profile
      console.log('Updating existing profile...');
      const { data, error, status } = await client
        .from('intern_profiles')
        .update({
          email: profile.email,
          first_name: profile.first_name || existingProfile.first_name,
          last_name: profile.last_name || existingProfile.last_name,
          phone_number: profile.phone_number || existingProfile.phone_number,
          github_url: profile.github_url || existingProfile.github_url,
          location: profile.location || existingProfile.location,
          university: profile.university || existingProfile.university,
          major: profile.major || existingProfile.major,
          graduation_year: profile.graduation_year || existingProfile.graduation_year,
          resume_url: profile.resume_url || existingProfile.resume_url
        })
        .eq('user_id', profile.user_id)
        .select()
        .single();

      console.log('Update result:', { data, error, status });

      if (error) {
        console.error('Error updating intern profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          status
        });
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log('Profile updated successfully:', data);
      return data;
    }
  } catch (error: unknown) {
    console.error('Error in createOrUpdateInternProfile:', {
      error,
      errorType: error instanceof Error ? 'Error' : typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    // If we got an empty error object, provide a more helpful error message
    if (error && typeof error === 'object' && Object.keys(error).length === 0) {
      throw new Error('Database connection failed. Please check your Supabase configuration and connection.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while updating profile');
  }
}

export async function uploadResume(userId: string, file: File, useClerkAuth = true) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    // Get the appropriate Supabase client
    const client = await getSupabaseClient(useClerkAuth);

    // Create a unique file path using userId and timestamp
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${timestamp}.${fileExt}`;

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await client.storage
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
    } as InternProfile, useClerkAuth);

    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadResume:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while uploading resume');
  }
} 