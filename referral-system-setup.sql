-- Create referral codes table
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES intern_profiles(user_id),
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code)
);

-- Create referrals table to track referrals and their status
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES intern_profiles(user_id),
  referred_user_id UUID NOT NULL REFERENCES intern_profiles(user_id),
  referral_code TEXT NOT NULL REFERENCES referral_codes(code),
  status TEXT NOT NULL DEFAULT 'pending',
  completed_task_count INT DEFAULT 0,
  points_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'joined', 'completed_task')),
  UNIQUE(referred_user_id)
);

-- Add RLS policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referral_codes
CREATE POLICY "Users can view their own referral codes"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for referrals
CREATE POLICY "Users can view referrals they've made"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert new referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update referral status"
  ON referrals FOR UPDATE
  USING (true);

-- Function to safely increment referral points
CREATE OR REPLACE FUNCTION increment_referral_points(user_id UUID, points_to_add INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE intern_profiles
  SET total_points = COALESCE(total_points, 0) + points_to_add
  WHERE user_id = $1;
END;
$$; 