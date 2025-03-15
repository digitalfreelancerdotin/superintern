'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useToast } from '@/app/components/ui/use-toast';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [hasTrackedVisit, setHasTrackedVisit] = useState(false);

  useEffect(() => {
    // Get referral code from URL if present
    const ref = searchParams.get('ref');
    if (ref && !hasTrackedVisit) {
      setReferralCode(ref);
      trackReferralVisit(ref);
      setHasTrackedVisit(true);
    }
  }, [searchParams, hasTrackedVisit]);

  const trackReferralVisit = async (referralCode: string) => {
    try {
      const response = await fetch('/api/referral/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to track referral visit');
      }
    } catch (error) {
      console.error('Error tracking referral:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // First create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user data returned');

      // Create intern profile
      const { error: profileError } = await supabase
        .from('intern_profiles')
        .insert({
          user_id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
        });

      if (profileError) throw profileError;

      // If there's a referral code, handle the referral
      if (referralCode) {
        console.log('Starting referral process...');
        
        // First verify the referral code and check if referrer is an intern
        const { data: referralData, error: referralError } = await supabase
          .from('referral_codes')
          .select(`
            user_id, 
            code,
            intern_profiles!inner(
              is_admin
            )
          `)
          .eq('code', referralCode)
          .single();

        if (referralError) {
          console.error('Error verifying referral code:', referralError);
          toast({
            title: "Warning",
            description: "Invalid referral code, but your account was created successfully.",
            variant: "default",
          });
        } else if (referralData) {
          // Check if referrer is not an admin (is an intern)
          const referrerProfile = Array.isArray(referralData.intern_profiles) 
            ? referralData.intern_profiles[0] 
            : referralData.intern_profiles;

          if (referrerProfile?.is_admin) {
            console.log('Referrer is an admin, not creating referral record');
            toast({
              title: "Warning",
              description: "Admins cannot refer new interns. Your account was created successfully.",
              variant: "default",
            });
          } else {
            // Create the referral record
            const referralInsert = {
              referrer_id: referralData.user_id,
              referred_user_id: authData.user.id,
              referral_code: referralCode,
              status: 'pending',
              points_awarded: false,
              completed_task_count: 0
            };

            const { error: createReferralError } = await supabase
              .from('referrals')
              .insert([referralInsert]);

            if (createReferralError) {
              console.error('Error creating referral record:', createReferralError);
              toast({
                title: "Warning",
                description: "Your account was created, but there was an issue recording the referral.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Success",
                description: "Account created and referral recorded successfully!",
              });
            }
          }
        } else {
          toast({
            title: "Warning",
            description: "Invalid referral code, but your account was created successfully.",
            variant: "default",
          });
        }
      }

      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
      });

      router.push('/verify');

      // Mark referral as converted
      await markReferralConverted(referralCode);
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markReferralConverted = async (referralCode: string) => {
    try {
      const { data, error } = await supabase
        .from('referral_visits')
        .update({ converted: true })
        .eq('referral_code', referralCode)
        .is('converted', false)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking referral as converted:', error);
    }
  };

  const createUserProfile = async (userId: string, referralCode: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            referral_code: referralCode,
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  // Helper function to generate a unique referral code
  const generateReferralCode = () => {
    // Generate a random string of 8 characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-2xl font-bold mb-6">Create an Account</h1>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            First Name
          </label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            Last Name
          </label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="border-t pt-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">Have a Referral Code?</h3>
            <p className="text-sm text-blue-600 mb-3">
              Enter a referral code from an existing intern to join their network!
            </p>
            <Input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code"
              className="bg-white"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
    </div>
  );
} 