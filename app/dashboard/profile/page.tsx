'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/app/components/ui/card';
import { ReferralStats } from '@/app/components/ReferralStats';
import { useAuth } from '@/app/context/auth-context';

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  total_points: number;
  is_admin: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('intern_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in loadProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-8">Profile not found</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Name</h2>
            <p>{profile.first_name} {profile.last_name}</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Email</h2>
            <p>{profile.email}</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Total Points</h2>
            <p>{profile.total_points}</p>
          </div>
          
          {profile.is_admin && (
            <div>
              <span className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                Admin
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Referral Program</h2>
        <p className="text-gray-600 mb-6">
          Share your referral link with friends and earn 100 points when they join and complete their first task!
        </p>
        {/* Comment out or remove if not needed here */}
        {/* <ReferralShare /> */}
      </Card>

      <Card className="p-6">
        <ReferralStats />
      </Card>
    </div>
  );
} 