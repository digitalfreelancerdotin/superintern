import { supabase } from './supabase';

// Test function to check if we can connect to Supabase and read data
export async function testSupabaseConnection() {
  try {
    console.log('Testing basic Supabase connection...');
    const { data, error } = await supabase.from('intern_profiles').select('count');
    
    console.log('Connection test result:', {
      success: !error,
      data,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details
      } : null
    });
    
    return {
      success: !error,
      data,
      error
    };
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return {
      success: false,
      error
    };
  }
}

// Test function to check if we can write data to Supabase
export async function testSupabaseWrite(userId: string) {
  try {
    console.log('Testing Supabase write operation...');
    console.log('Using client with userId:', userId);
    
    // Use the regular Supabase client
    const client = supabase;
    
    // Create a test record with timestamp
    const testData = {
      user_id: userId,
      email: `test-${Date.now()}@example.com`,
      first_name: 'Test',
      last_name: 'User',
      test_timestamp: new Date().toISOString()
    };
    
    // Try to insert the test data
    const { data, error } = await client
      .from('intern_profiles')
      .upsert(testData)
      .select();
    
    console.log('Write test result:', {
      success: !error,
      data,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details
      } : null
    });
    
    return {
      success: !error,
      data,
      error
    };
  } catch (error) {
    console.error('Error testing Supabase write operation:', error);
    return {
      success: false,
      error
    };
  }
}

// Test function to check if we can read specific data from Supabase
export async function testSupabaseRead(userId: string) {
  try {
    console.log('Testing Supabase read operation...');
    console.log('Using client with userId:', userId);
    
    // Use the regular Supabase client
    const client = supabase;
    
    // Try to read data for the specified user
    const { data, error } = await client
      .from('intern_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    console.log('Read test result:', {
      success: !error,
      found: !!data,
      data,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details
      } : null
    });
    
    return {
      success: !error,
      found: !!data,
      data,
      error
    };
  } catch (error) {
    console.error('Error testing Supabase read operation:', error);
    return {
      success: false,
      error
    };
  }
} 