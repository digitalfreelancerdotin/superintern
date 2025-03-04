-- Create intern_profiles table
CREATE TABLE IF NOT EXISTS intern_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  github_url TEXT,
  resume_url TEXT,
  location TEXT,
  university TEXT,
  major TEXT,
  graduation_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique index on user_id to ensure one profile per user
CREATE UNIQUE INDEX IF NOT EXISTS intern_profiles_user_id_idx ON intern_profiles(user_id);

-- Set up Row Level Security (RLS) policies
ALTER TABLE intern_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON intern_profiles;
CREATE POLICY "Users can view their own profile"
  ON intern_profiles
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Create policy to allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON intern_profiles;
CREATE POLICY "Users can insert their own profile"
  ON intern_profiles
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

-- Create policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON intern_profiles;
CREATE POLICY "Users can update their own profile"
  ON intern_profiles
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

-- Create policy to allow users to delete their own profile
DROP POLICY IF EXISTS "Users can delete their own profile" ON intern_profiles;
CREATE POLICY "Users can delete their own profile"
  ON intern_profiles
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- Grant necessary permissions to the intern_profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON intern_profiles TO authenticated; 