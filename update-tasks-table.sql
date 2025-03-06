-- Drop existing table and recreate with new fields
DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES intern_profiles(user_id),
  created_by UUID REFERENCES intern_profiles(user_id),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_payment CHECK (
    (is_paid = false AND payment_amount IS NULL) OR 
    (is_paid = true AND payment_amount > 0)
  )
);

-- Enable RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Recreate policies
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

CREATE POLICY "Admins can create tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM intern_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can delete tasks"
ON tasks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM intern_profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
); 