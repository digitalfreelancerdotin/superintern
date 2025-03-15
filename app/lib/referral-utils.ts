import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const POINTS_PER_REFERRAL = 50; // Points awarded for each successful referral
const TASKS_REQUIRED = 3; // Number of tasks referred user needs to complete

// Generate a random referral code
export function generateReferralCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Ensure referral code exists for a user
export async function ensureReferralCode(userId: string): Promise<string | null> {
  try {
    // First, check if user already has a referral code
    const { data: existingCode, error: fetchError } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing referral code:', fetchError);
      return null;
    }

    // If code exists, return it
    if (existingCode?.code) {
      return existingCode.code;
    }

    // If no code exists, generate a new one with retries
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const newCode = generateReferralCode();
      
      const { data, error: insertError } = await supabase
        .from('referral_codes')
        .insert({ user_id: userId, code: newCode })
        .select('code')
        .single();

      if (!insertError && data) {
        return data.code;
      }

      console.error(`Attempt ${attempts + 1} failed:`, insertError);
      attempts++;
    }

    console.error('Failed to create referral code after multiple attempts');
    return null;
  } catch (error) {
    console.error('Error in ensureReferralCode:', error);
    return null;
  }
}

interface ReferralData {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  completed_task_count: number;
  points_awarded: boolean;
  status: string;
}

export async function handleReferralTaskCompletion(userId: string) {
  try {
    // Find the referral record for this user
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .single();

    if (referralError) {
      console.error('Error finding referral:', referralError);
      return;
    }

    if (!referralData) {
      console.log('No referral found for user:', userId);
      return;
    }

    // If points were already awarded, no need to proceed
    if (referralData.points_awarded) {
      console.log('Points already awarded for this referral');
      return;
    }

    // Increment the completed task count
    const newTaskCount = (referralData.completed_task_count || 0) + 1;
    
    // Update the referral record with new task count
    const { error: updateError } = await supabase
      .from('referrals')
      .update({ 
        completed_task_count: newTaskCount,
        // If they've completed enough tasks, mark points as awarded and update status
        ...(newTaskCount >= TASKS_REQUIRED ? {
          points_awarded: true,
          status: 'completed'
        } : {})
      })
      .eq('id', referralData.id);

    if (updateError) {
      console.error('Error updating referral:', updateError);
      return;
    }

    // If they've completed the required number of tasks, award points to referrer
    if (newTaskCount >= TASKS_REQUIRED) {
      const { error: pointsError } = await supabase.rpc('increment_referral_points', {
        user_id: referralData.referrer_id,
        points_to_add: POINTS_PER_REFERRAL
      });

      if (pointsError) {
        console.error('Error awarding points:', pointsError);
        return;
      }

      console.log(`Awarded ${POINTS_PER_REFERRAL} points to referrer ${referralData.referrer_id}`);
    } else {
      console.log(`User has completed ${newTaskCount}/${TASKS_REQUIRED} tasks needed for referral points`);
    }
  } catch (error) {
    console.error('Error in handleReferralTaskCompletion:', error);
  }
} 