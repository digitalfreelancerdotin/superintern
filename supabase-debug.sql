-- Check the type and value of auth.uid()
SELECT 
  pg_typeof(auth.uid()) as type,
  auth.uid() as value,
  auth.uid()::text as text_value;

-- Create a simple test table
CREATE TABLE IF NOT EXISTS test_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE test_profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy with explicit type casting
DROP POLICY IF EXISTS "Test policy" ON test_profiles;
CREATE POLICY "Test policy"
  ON test_profiles
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Only insert if auth.uid() is not null
DO $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO test_profiles (user_id)
    VALUES (auth.uid()::text);
  ELSE
    RAISE NOTICE 'Not inserting test row because auth.uid() is NULL. You need to be authenticated to insert a row.';
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_profiles TO authenticated; 