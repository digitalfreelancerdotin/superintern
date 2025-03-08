-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view open tasks" ON tasks;

-- Create policy to allow all authenticated users to view open tasks
CREATE POLICY "Users can view open tasks" ON tasks
FOR SELECT
USING (
    -- Allow viewing if:
    -- 1. Task is open and not assigned, OR
    -- 2. Task is assigned to the user, OR
    -- 3. User is an admin
    status = 'open' 
    OR assigned_to = auth.uid()
    OR EXISTS (
        SELECT 1 FROM intern_profiles
        WHERE user_id = auth.uid()
        AND is_admin = true
    )
);

-- Ensure authenticated users have SELECT permission
GRANT SELECT ON tasks TO authenticated; 