import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function uploadResume(file: File, userId: string) {
  const supabase = createClientComponentClient();
  
  try {
    console.log('Starting resume upload for user:', userId);
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = fileName;
    
    console.log('Attempting to upload file:', filePath);

    // Upload with retry logic
    let uploadError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Upload attempt ${attempt} of ${MAX_RETRIES}`);
        
        // First check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found');
        }

        const { error } = await supabase.storage
          .from('resumes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            duplex: 'half'
          });

        if (!error) {
          console.log('Upload successful on attempt:', attempt);
          uploadError = null;
          break;
        }
        console.error(`Upload error on attempt ${attempt}:`, error);
        uploadError = error;
      } catch (error) {
        console.error(`Error on upload attempt ${attempt}:`, error);
        uploadError = error;
      }

      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY * attempt}ms before retry...`);
        await delay(RETRY_DELAY * attempt);
      }
    }

    if (uploadError) {
      console.error('All upload attempts failed:', uploadError);
      throw uploadError;
    }

    console.log('Getting public URL for uploaded file');
    // Get the public URL with retry logic
    let publicUrl = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await supabase.storage
          .from('resumes')
          .getPublicUrl(filePath);
        publicUrl = data.publicUrl;
        console.log('Successfully got public URL:', publicUrl);
        break;
      } catch (error) {
        console.error(`Error getting public URL on attempt ${attempt}:`, error);
        if (attempt === MAX_RETRIES) throw error;
        await delay(RETRY_DELAY * attempt);
      }
    }

    if (!publicUrl) {
      throw new Error('Failed to get public URL after retries');
    }

    console.log('Updating user profile with resume URL');
    // Update the user's profile with the resume URL
    const { error: updateError } = await supabase
      .from('intern_profiles')
      .update({ resume_url: publicUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw updateError;
    }

    console.log('Resume upload completed successfully');
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error in uploadResume:', error);
    return { success: false, error };
  }
}

export async function deleteResume(userId: string, resumeUrl: string) {
  const supabase = createClientComponentClient();
  
  try {
    console.log('Starting resume deletion for user:', userId);
    
    // Extract the file path from the URL
    const filePath = resumeUrl.split('/').slice(-2).join('/');
    console.log('Attempting to delete file:', filePath);

    // Delete the file from storage with retry logic
    let deleteError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Delete attempt ${attempt} of ${MAX_RETRIES}`);
        
        // First check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found');
        }

        const { error } = await supabase.storage
          .from('resumes')
          .remove([filePath]);
          
        if (!error) {
          console.log('Delete successful on attempt:', attempt);
          deleteError = null;
          break;
        }
        console.error(`Delete error on attempt ${attempt}:`, error);
        deleteError = error;
      } catch (error) {
        console.error(`Error on delete attempt ${attempt}:`, error);
        deleteError = error;
      }

      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY * attempt}ms before retry...`);
        await delay(RETRY_DELAY * attempt);
      }
    }

    if (deleteError) {
      console.error('All delete attempts failed:', deleteError);
      throw deleteError;
    }

    console.log('Updating user profile to remove resume URL');
    // Update the user's profile to remove the resume URL
    const { error: updateError } = await supabase
      .from('intern_profiles')
      .update({ resume_url: null })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw updateError;
    }

    console.log('Resume deletion completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteResume:', error);
    return { success: false, error };
  }
} 