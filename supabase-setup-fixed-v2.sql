-- Create intern_profiles table
CREATE TABLE IF NOT EXISTS intern_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_intern_profiles_updated_at ON intern_profiles;
CREATE TRIGGER update_intern_profiles_updated_at
BEFORE UPDATE ON intern_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS) policies
ALTER TABLE intern_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON intern_profiles;
CREATE POLICY "Users can view their own profile"
  ON intern_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON intern_profiles;
CREATE POLICY "Users can insert their own profile"
  ON intern_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON intern_profiles;
CREATE POLICY "Users can update their own profile"
  ON intern_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own profile
DROP POLICY IF EXISTS "Users can delete their own profile" ON intern_profiles;
CREATE POLICY "Users can delete their own profile"
  ON intern_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for resumes if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the resumes bucket
-- Allow authenticated users to upload their own resumes
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own resumes
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
CREATE POLICY "Users can update their own resumes"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own resumes
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public access to read resumes
DROP POLICY IF EXISTS "Public can read resumes" ON storage.objects;
CREATE POLICY "Public can read resumes"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'resumes');

-- Grant necessary permissions to the intern_profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON intern_profiles TO authenticated;

-- Create a view to get user profiles with additional user information
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  p.*,
  u.email as auth_email,
  u.created_at as user_created_at
FROM
  intern_profiles p
JOIN
  auth.users u ON p.user_id = u.id;

-- Grant permissions on the view after it's created
GRANT SELECT ON user_profiles TO authenticated; 