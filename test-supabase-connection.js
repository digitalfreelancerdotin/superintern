// Simple script to test Supabase connection
// Run with: node test-supabase-connection.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection with:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 5)}...` : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    const { data, error, status } = await supabase.from('intern_profiles').select('count');
    
    console.log('Response status:', status);
    
    if (error) {
      console.error('Connection error:', error);
      
      // Check if the error indicates the table doesn't exist
      if (error.message && error.message.includes('does not exist')) {
        console.error('\nThe intern_profiles table does not exist!');
        console.error('Please run the SQL setup script in your Supabase dashboard.');
      }
      
      return false;
    }
    
    console.log('Connection successful!');
    console.log('Response data:', data);
    
    console.log('\n2. Testing storage access...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('Storage access error:', storageError);
      return false;
    }
    
    console.log('Storage access successful!');
    console.log('Buckets:', buckets);
    
    // Check if resumes bucket exists
    const resumesBucket = buckets.find(bucket => bucket.name === 'resumes');
    if (!resumesBucket) {
      console.warn('\nWarning: The "resumes" bucket does not exist.');
      console.warn('The application will try to create it automatically, or you can create it manually in the Supabase dashboard.');
    } else {
      console.log('\nThe "resumes" bucket exists!');
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error during connection test:', error);
    return false;
  }
}

testConnection()
  .then(success => {
    console.log('\nConnection test completed.');
    if (success) {
      console.log('✅ All tests passed! Your Supabase connection is working correctly.');
    } else {
      console.log('❌ Some tests failed. Please check the errors above and follow the troubleshooting guide.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 