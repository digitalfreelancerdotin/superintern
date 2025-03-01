-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create policies for intern_profiles
CREATE POLICY "Allow individual read access" ON intern_profiles
    FOR SELECT USING (true);  -- Allow public read access for leaderboard

CREATE POLICY "Allow individual create access" ON intern_profiles
    FOR INSERT WITH CHECK (true);  -- Allow authenticated users to create their profile

CREATE POLICY "Allow individual update access" ON intern_profiles
    FOR UPDATE USING (true)
    WITH CHECK (true);  -- Allow users to update their own profile

-- Enable Storage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Allow individual storage access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow individual storage access"
ON storage.objects
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (true);

-- Grant necessary permissions to the service_role
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role; 