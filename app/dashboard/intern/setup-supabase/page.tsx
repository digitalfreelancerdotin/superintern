'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { testSupabaseConnection } from '../../../lib/supabase-test';

export default function SetupSupabasePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // SQL setup script
  const sqlSetupScript = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to get the user ID from the JWT
CREATE OR REPLACE FUNCTION requesting_user_id() 
RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;

-- Create intern_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS intern_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    github_url TEXT,
    location TEXT,
    university TEXT,
    major TEXT,
    graduation_year TEXT,
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE intern_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow individual read access" ON intern_profiles;
DROP POLICY IF EXISTS "Allow individual create access" ON intern_profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON intern_profiles;
DROP POLICY IF EXISTS "Users can only access their own data" ON intern_profiles;

-- Create policies for intern_profiles
CREATE POLICY "Allow public read access" ON intern_profiles
    FOR SELECT USING (true);  -- Allow public read access for leaderboard

CREATE POLICY "Users can create their own profile" ON intern_profiles
    FOR INSERT WITH CHECK (user_id = requesting_user_id());

CREATE POLICY "Users can update their own profile" ON intern_profiles
    FOR UPDATE USING (user_id = requesting_user_id())
    WITH CHECK (user_id = requesting_user_id());

-- Enable Storage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Allow individual storage access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow bucket management" ON storage.buckets;
DROP POLICY IF EXISTS "Users can access their own storage objects" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (true);

CREATE POLICY "Users can access their own storage objects"
ON storage.objects
FOR ALL
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = requesting_user_id())
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = requesting_user_id());

CREATE POLICY "Allow bucket management"
ON storage.buckets
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to the service_role
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;`;

  // Test the connection to see if the table exists
  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy SQL to clipboard
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supabase Setup Guide</h1>
        <div className="flex gap-2">
          <a href="/dashboard" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
            Back to Dashboard
          </a>
          <a href="/dashboard/intern/test-supabase" className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded">
            Test Supabase
          </a>
        </div>
      </div>
      
      <Card className="p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Step 1: Test Connection</h2>
        <p className="mb-2">First, let's check if your Supabase database is properly set up.</p>
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Button>
        
        {testResult && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Test Result:</h3>
            <div className="bg-gray-100 p-2 rounded mt-2">
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
            
            {testResult.error && testResult.error.message && testResult.error.message.includes('does not exist') && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                <p className="font-medium">The intern_profiles table does not exist!</p>
                <p>You need to run the SQL setup script in your Supabase dashboard.</p>
              </div>
            )}
          </div>
        )}
      </Card>
      
      <Card className="p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Step 2: Run SQL Setup Script</h2>
        <p className="mb-2">Follow these steps to set up your Supabase database:</p>
        <ol className="list-decimal pl-5 mb-4">
          <li className="mb-1">Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
          <li className="mb-1">Select your project</li>
          <li className="mb-1">Go to the SQL Editor (in the left sidebar)</li>
          <li className="mb-1">Click "New Query"</li>
          <li className="mb-1">Copy and paste the SQL script below</li>
          <li className="mb-1">Click "Run" to execute the script</li>
        </ol>
        
        <div className="relative">
          <Button onClick={copySqlToClipboard} className="mb-2">
            {sqlCopied ? 'Copied!' : 'Copy SQL Script'}
          </Button>
          <div className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            <pre className="text-sm">{sqlSetupScript}</pre>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 mb-4">
        <h2 className="text-xl font-semibold mb-2">Step 3: Verify Setup</h2>
        <p className="mb-2">After running the SQL script, test the connection again to verify that everything is set up correctly.</p>
        <Button onClick={testConnection}>
          Test Connection Again
        </Button>
        
        {testResult && testResult.success && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="font-medium">Success! Your Supabase database is properly set up.</p>
            <p>You can now return to the dashboard and use the application.</p>
          </div>
        )}
      </Card>
      
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">Step 4: Create JWT Template in Clerk</h2>
        <p className="mb-2">To enable Clerk authentication with Supabase, you need to create a JWT template:</p>
        <ol className="list-decimal pl-5 mb-4">
          <li className="mb-1">Go to your <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Clerk Dashboard</a></li>
          <li className="mb-1">Navigate to the JWT Templates section</li>
          <li className="mb-1">Click "New Template"</li>
          <li className="mb-1">Select "Supabase" from the list</li>
          <li className="mb-1">Name it "supabase"</li>
          <li className="mb-1">For the signing key, use your Supabase JWT Secret (found in Supabase Dashboard {'>'}  Settings {'>'}  API {'>'}  JWT Settings)</li>
          <li className="mb-1">Save the template</li>
        </ol>
        <p>After completing these steps, your application should be able to store data in Supabase with proper authentication.</p>
      </Card>
    </div>
  );
} 