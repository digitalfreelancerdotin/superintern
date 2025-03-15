import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/app/components/ui/card';

interface ReferralData {
  id: string;
  referred_user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  status: string;
  completed_task_count: number;
  points_awarded: boolean;
  created_at: string;
}

export function ReferralStats() {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          completed_task_count,
          points_awarded,
          created_at,
          referred_user:profiles!inner(
            first_name,
            last_name,
            email
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading referrals:', error);
        return;
      }

      const formattedData: ReferralData[] = (data || []).map(item => ({
        ...item,
        referred_user: Array.isArray(item.referred_user) ? item.referred_user[0] : item.referred_user
      }));
      setReferrals(formattedData);
    } catch (error) {
      console.error('Error in loadReferrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Your Referrals</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {referrals.length === 0 ? (
          <p className="text-gray-500">No referrals yet. Share your referral link to get started!</p>
        ) : (
          referrals.map((referral) => (
            <Card key={referral.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {referral.referred_user.first_name} {referral.referred_user.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{referral.referred_user.email}</p>
                  <p className="text-sm mt-2">
                    Joined: {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    referral.status === 'completed_task' 
                      ? 'bg-green-100 text-green-800'
                      : referral.status === 'joined'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {referral.status === 'completed_task' 
                      ? 'Completed Task'
                      : referral.status === 'joined'
                      ? 'Joined'
                      : 'Pending'}
                  </span>
                  {referral.points_awarded && (
                    <p className="text-sm text-green-600 mt-2">
                      +100 points awarded
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 