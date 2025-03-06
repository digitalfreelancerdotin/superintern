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
    console.log('[getInternProfile] Starting profile fetch for userId:', userId);
    
    if (!userId) {
      console.error('[getInternProfile] No userId provided');
      throw new Error('User ID is required for fetching profile');
    }

    console.log('[getInternProfile] Creating Supabase client...');
    const supabase = createClientComponentClient();
    
    console.log('[getInternProfile] Getting session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[getInternProfile] Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!sessionData.session) {
      console.error('[getInternProfile] No active session found');
      throw new Error('No active session found');
    }

    console.log('[getInternProfile] Session found, fetching profile...');
    const { data: profile, error: profileError } = await supabase
      .from('intern_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('[getInternProfile] Database error:', profileError);
      throw new Error(`Database error: ${profileError.message}`);
    }

    if (!profile) {
      console.log('[getInternProfile] No profile found for user:', userId);
      // Instead of returning null, let's create a new profile
      console.log('[getInternProfile] Attempting to create new profile...');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user?.email) {
        throw new Error('User email not found');
      }

      const newProfile = {
        user_id: userId,
        email: userData.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('intern_profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error('[getInternProfile] Error creating new profile:', createError);
        throw new Error(`Failed to create new profile: ${createError.message}`);
      }

      console.log('[getInternProfile] Created new profile:', createdProfile);
      return createdProfile;
    }

    console.log('[getInternProfile] Successfully found profile:', profile);
    return profile;
  } catch (error) {
    console.error('[getInternProfile] Caught error:', error);
    if (error instanceof Error) {
      throw new Error(`Profile fetch failed: ${error.message}`);
    }
    throw new Error(`Profile fetch failed: ${JSON.stringify(error)}`);
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