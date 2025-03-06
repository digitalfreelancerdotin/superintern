-- Add is_admin column to intern_profiles table
ALTER TABLE intern_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update RLS policies to include admin check
DROP POLICY IF EXISTS "Users can view their own profile" ON intern_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON intern_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON intern_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON intern_profiles;

-- Recreate policies with admin access
CREATE POLICY "Users can view their own profile or admins can view all"
ON intern_profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM intern_profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

CREATE POLICY "Users can update their own profile or admins can update all"
ON intern_profiles FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM intern_profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    )
)
WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM intern_profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

CREATE POLICY "Users can insert their own profile"
ON intern_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile or admins can delete any"
ON intern_profiles FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM intern_profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    )
); 