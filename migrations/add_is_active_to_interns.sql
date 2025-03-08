-- Add is_active column to intern_profiles
ALTER TABLE intern_profiles
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE intern_profiles
SET is_active = true
WHERE is_active IS NULL;

-- Add policy to allow admins to update is_active status
CREATE POLICY "Admins can update intern active status"
  ON intern_profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM intern_profiles 
      WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM intern_profiles 
      WHERE is_admin = true
    )
  ); 