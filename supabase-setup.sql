-- Enable UUID extension
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
GRANT ALL ON storage.buckets TO service_role; 