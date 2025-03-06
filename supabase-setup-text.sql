-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies manually first
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON intern_profiles;
DROP POLICY IF EXISTS "Temporary full access" ON intern_profiles;
DROP POLICY IF EXISTS "Users can update their own profile or admins can update all" ON intern_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile or admins can delete any" ON intern_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON intern_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON intern_profiles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON intern_profiles;

-- Disable RLS temporarily
ALTER TABLE intern_profiles DISABLE ROW LEVEL SECURITY;

-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS intern_profiles CASCADE;

-- Create intern_profiles table
CREATE TABLE intern_profiles (
  user_id UUID PRIMARY KEY,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT false
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10,2),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES intern_profiles(user_id),
  assigned_to UUID REFERENCES intern_profiles(user_id),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled'))
);

-- Create the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_intern_profiles_updated_at
BEFORE UPDATE ON intern_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE intern_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for intern_profiles
CREATE POLICY "Allow all operations for authenticated users"
ON intern_profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for tasks
CREATE POLICY "Users can view tasks assigned to them"
ON tasks
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()::uuid
  OR created_by = auth.uid()::uuid
  OR EXISTS (
    SELECT 1 FROM intern_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Admins can create tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM intern_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Admins can update tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM intern_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM intern_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Admins can delete tasks"
ON tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM intern_profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
);

-- Grant permissions
GRANT ALL ON intern_profiles TO authenticated;
GRANT ALL ON tasks TO authenticated;

-- Create the new user handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.intern_profiles (user_id, email)
  VALUES (new.id::uuid, new.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Drop storage policies manually
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Service role bypass" ON storage.objects;
DROP POLICY IF EXISTS "Enable resume upload for users" ON storage.objects;
DROP POLICY IF EXISTS "Enable resume update for users" ON storage.objects;
DROP POLICY IF EXISTS "Enable resume read for users" ON storage.objects;
DROP POLICY IF EXISTS "Enable resume delete for users" ON storage.objects;
DROP POLICY IF EXISTS "Allow all storage operations" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow all storage operations"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 