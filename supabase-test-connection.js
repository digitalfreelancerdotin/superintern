// Test script for Supabase connection and database operations
const { createClient } = require('@supabase/supabase-js');

// Hardcoded values from .env.local
const supabaseUrl = 'https://vxckgpfduybjrqgiufss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Y2tncGZkdXlianJxZ2l1ZnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3ODg5OTAsImV4cCI6MjA1NjM2NDk5MH0.CcpXxcXMmPN-VsHl1n-RwxRVUSF2UoXcEsDljmfGxJY';

console.log('Testing Supabase connection with:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 10) + '...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('intern_profiles')
      .select('count');
    
    if (error) {
      console.error('Connection failed:', error);
      return;
    }
    
    console.log('Connection successful!');
    console.log('Data:', data);
    
    // Test auth functionality
    console.log('\nTesting auth functionality...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth functionality failed:', authError);
    } else {
      console.log('Auth functionality working');
      console.log('Session:', authData);
    }
    
    // Test inserting a test profile
    console.log('\nTesting profile insertion...');
    const testUserId = 'test-user-' + Date.now();
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('intern_profiles')
      .insert([
        {
          user_id: testUserId,
          email: testEmail,
          first_name: 'Test',
          last_name: 'User'
        }
      ])
      .select();
    
    if (insertError) {
      console.error('Insert test failed:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      });
    } else {
      console.log('Insert test successful!');
      console.log('Inserted data:', insertData);
      
      // Clean up the test data
      console.log('\nCleaning up test data...');
      const { error: deleteError } = await supabase
        .from('intern_profiles')
        .delete()
        .eq('user_id', testUserId);
      
      if (deleteError) {
        console.error('Delete test failed:', deleteError);
      } else {
        console.log('Test data cleaned up successfully');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();