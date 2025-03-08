-- Add parent_id column to task_comments table
ALTER TABLE task_comments
ADD COLUMN parent_id UUID REFERENCES task_comments(id);

-- Add index for faster lookups
CREATE INDEX idx_task_comments_parent_id ON task_comments(parent_id);

-- Update RLS policies to allow access to threaded comments
CREATE POLICY "Users can view all comments in their tasks"
ON task_comments FOR SELECT
TO authenticated
USING (
  task_id IN (
    SELECT id FROM tasks
    WHERE created_by = auth.uid() 
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM intern_profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  )
); 