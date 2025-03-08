'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import { Card } from '@/app/components/ui/card';
import { Twitter, Facebook, Linkedin, MessageCircle, Copy } from 'lucide-react';

interface ReferralCode {
  code: string;
  created_at: string;
}

interface InternProfile {
  first_name: string;
  last_name: string;
  email: string;
}

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  completed_task_count: number;
  points_awarded: boolean;
  created_at: string;
  intern_profiles: InternProfile;
}

interface ReferralResponse {
  id: string;
  referred_user_id: string;
  status: string;
  completed_task_count: number;
  points_awarded: boolean;
  created_at: string;
  intern_profiles: InternProfile[];
}

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Load referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('code, created_at')
        .eq('user_id', user.id)
        .single();

      if (codeError && codeError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw codeError;
      }

      setReferralCode(codeData);

      // Load referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_user_id,
          status,
          completed_task_count,
          points_awarded,
          created_at,
          intern_profiles:intern_profiles!referrals_referred_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;
      
      // Transform the data to match our Referral interface
      const transformedReferrals: Referral[] = (referralsData || []).map((referral: ReferralResponse) => ({
        ...referral,
        intern_profiles: referral.intern_profiles[0] // Take first profile since it's a 1-1 relationship
      }));

      setReferrals(transformedReferrals);
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Generate a random code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from('referral_codes')
        .insert([{ user_id: user.id, code }])
        .select('code, created_at')
        .single();

      if (error) throw error;
      setReferralCode(data);
      
      toast({
        title: "Success",
        description: "Referral code generated successfully!",
      });
    } catch (error) {
      console.error('Error generating referral code:', error);
      toast({
        title: "Error",
        description: "Failed to generate referral code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getReferralLink = () => {
    if (!referralCode) return '';
    return `${window.location.origin}/signup?ref=${referralCode.code}`;
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent("Join me as an intern and start earning while learning! Use my referral code: ");
    const url = encodeURIComponent(getReferralLink());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getReferralLink());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(getReferralLink());
    const title = encodeURIComponent("Join our intern program!");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Join me as an intern! Use my referral code: ${referralCode?.code}\n${getReferralLink()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Success",
        description: "Referral link copied to clipboard!",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Referrals Dashboard</h1>

      {/* Referral Code Section */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
        {referralCode ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-lg font-mono">{referralCode.code}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Share this link with potential interns:
              </p>
              <p className="text-sm font-mono bg-background p-2 rounded mt-1">
                {getReferralLink()}
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button onClick={copyReferralLink} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy Referral Link
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={shareToTwitter}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Share on Twitter
                </Button>
                <Button 
                  onClick={shareToFacebook}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Share on Facebook
                </Button>
                <Button 
                  onClick={shareToLinkedIn}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  Share on LinkedIn
                </Button>
                <Button 
                  onClick={shareToWhatsApp}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4">You haven't generated a referral code yet.</p>
            <Button onClick={generateReferralCode}>
              Generate Referral Code
            </Button>
          </div>
        )}
      </Card>

      {/* Referrals List Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Your Referrals</h2>
        {referrals.length > 0 ? (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <Card key={referral.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {referral.intern_profiles.first_name} {referral.intern_profiles.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {referral.intern_profiles.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      referral.points_awarded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {referral.points_awarded ? 'Completed' : 'In Progress'}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tasks: {referral.completed_task_count}/3
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            You haven't referred any interns yet. Share your referral code to get started!
          </p>
        )}
      </Card>
    </div>
  );
} 