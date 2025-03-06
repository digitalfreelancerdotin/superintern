-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES intern_profiles(user_id),
  created_by UUID REFERENCES intern_profiles(user_id),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks assigned to them" ON tasks;

-- Updated policies for tasks
CREATE POLICY "Users can view tasks assigned to them"
ON tasks FOR SELECT
TO authenticated
USING (
  auth.uid() = assigned_to OR 
  EXISTS (
    SELECT 1 FROM intern_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can update tasks assigned to them"
ON tasks FOR UPDATE
TO authenticated
USING (
  auth.uid() = assigned_to OR 
  EXISTS (
    SELECT 1 FROM intern_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  auth.uid() = assigned_to OR 
  EXISTS (
    SELECT 1 FROM intern_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add policy for admins to create tasks
CREATE POLICY "Admins can create tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM intern_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add policy for admins to delete tasks
CREATE POLICY "Admins can delete tasks"
ON tasks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM intern_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create a function to update the updated_at timestamp for tasks
CREATE OR REPLACE FUNCTION update_task_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column for tasks
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_updated_at_column(); 