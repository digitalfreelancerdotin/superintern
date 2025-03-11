'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import { Card } from '@/app/components/ui/card';
import { Twitter, Facebook, Linkedin, MessageCircle, Copy } from 'lucide-react';
import { ReferralShare } from "@/app/components/ReferralShare";

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Referrals Dashboard</h1>
      <ReferralShare key="referrals-page" />
    </div>
  );
} 