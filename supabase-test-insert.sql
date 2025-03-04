-- This script allows you to manually insert a test profile
-- Replace 'YOUR-USER-ID-HERE' with an actual user ID from your auth.users table

-- First, let's see what users exist in the auth.users table
SELECT id, email FROM auth.users LIMIT 10;

-- Then, insert a test profile with a specific user ID
-- Uncomment and modify the INSERT statement below when ready:


INSERT INTO intern_profiles (
  user_id,
  email,
  first_name,
  last_name
)
VALUES (
  '083a19c4-a782-40e3-9f52-d2db6f671009',  -- Replace with an actual user ID as TEXT
  'sp@bolofy.com',   -- Should match the email in auth.users
  'Test',
  'User'
);


-- To verify the insert worked:
SELECT * FROM intern_profiles;