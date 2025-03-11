"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "./ui/use-toast";
import { Card } from "./ui/card";
import { Copy, Twitter, Facebook, MessageCircle, Send, Link, Users, UserCheck, Award, QrCode, X, Download } from "lucide-react";
import { Button } from "./ui/button";

interface ReferralStats {
  totalVisits: number;
  successfulJoins: number;
  pointsEarned: number;
}

export function ReferralShare() {
  // 1. All state hooks
  const [stats, setStats] = useState<ReferralStats>({
    totalVisits: 0,
    successfulJoins: 0,
    pointsEarned: 0
  });
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // 2. Other hooks
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const isFetching = useRef(false);

  // 3. Data fetching function
  const fetchReferralStats = async () => {
    if (!referralCode || isFetching.current) return;
    
    try {
      isFetching.current = true;
      const { data, error } = await supabase
        .from('referral_visits')
        .select('*')
        .eq('referral_code', referralCode);

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        totalVisits: data?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      isFetching.current = false;
    }
  };

  // 4. Initialize data
  useEffect(() => {
    async function initializeData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code')
            .eq('user_id', user.id)
          .single();

        if (profile?.referral_code) {
          setReferralCode(profile.referral_code);
      }
    } catch (error) {
        console.error('Error initializing:', error);
    } finally {
      setIsLoading(false);
    }
    }

    initializeData();
  }, []);

  // 5. Update referral link when code changes
  useEffect(() => {
    if (referralCode) {
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/auth/signup?ref=${referralCode}`);
      fetchReferralStats();
    }
  }, [referralCode]);

  // 6. Setup realtime subscription
  useEffect(() => {
    if (!referralCode) return;

    const channel = supabase
      .channel(`referral_visits_${referralCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referral_visits',
          filter: `referral_code=eq.${referralCode}`
        },
        fetchReferralStats
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [referralCode]);

  // Generate QR code URL when referral link changes
  useEffect(() => {
    if (referralLink) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(referralLink)}`;
      console.log('Generated QR URL:', qrUrl);
      setQrCodeUrl(qrUrl);
    }
  }, [referralLink]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Success!",
        description: "Referral link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const copyQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast({
        title: "Success!",
        description: "QR code copied to clipboard",
      });
    } catch (err) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'referral-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been downloaded as an image",
      });
    }
  };

  const shareOnPlatform = (platform: string) => {
    const text = `Join me on SuperInterns! Sign up with your Google account`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + referralLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
    };
    window.open(urls[platform as keyof typeof urls]);
  };

  if (isLoading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Total Referral Visits",
            value: stats.totalVisits,
            icon: Users,
            description: "People who clicked your link",
            bgColor: "bg-blue-100",
            iconColor: "text-blue-500"
          },
          {
            title: "Successful Joins",
            value: stats.successfulJoins,
            icon: UserCheck,
            description: "People who signed up",
            bgColor: "bg-green-100",
            iconColor: "text-green-500"
          },
          {
            title: "Points Earned",
            value: stats.pointsEarned,
            icon: Award,
            description: "10 points per successful referral",
            bgColor: "bg-purple-100",
            iconColor: "text-purple-500"
          }
        ].map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
        </div>
        </div>
          </Card>
        ))}
          </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Share Your Link</h3>
        
        {/* Link and QR code section */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Referral link section */}
          <div className="flex-1">
            <div className="flex items-center p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mr-2 truncate">
                {referralLink || 'Generating link...'}
              </div>
              <button
                className="shrink-0 p-2 hover:bg-background rounded"
              onClick={copyToClipboard}
                disabled={!referralLink}
                title="Copy link"
            >
              <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* QR code and buttons section */}
          <div className="flex flex-col gap-3">
            {/* QR code in white container */}
            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-lg border shadow-sm w-fit">
                <img 
                  src={qrCodeUrl}
                  alt="Referral QR Code"
                  className="w-40 h-40"
                />
              </div>
            )}
            
            {/* Buttons below, outside the white container */}
            <div className="flex gap-2">
              <button
                onClick={copyQRCode}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Copy QR code"
              >
                <Copy className="h-4 w-4" />
                <span className="text-sm">Copy QR</span>
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCodeUrl;
                  link.download = 'referral-qr-code.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Download QR code"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Save QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Social share buttons */}
        <div className="flex flex-wrap gap-4">
          {[
            { name: 'Twitter', icon: Twitter, onClick: () => shareOnPlatform('twitter'), bgColor: 'bg-[#E8F5FD]', iconColor: 'text-[#1DA1F2]' },
            { name: 'Facebook', icon: Facebook, onClick: () => shareOnPlatform('facebook'), bgColor: 'bg-[#E7F3FF]', iconColor: 'text-[#1877F2]' },
            { name: 'WhatsApp', icon: MessageCircle, onClick: () => shareOnPlatform('whatsapp'), bgColor: 'bg-[#E7FFE7]', iconColor: 'text-[#25D366]' },
            { name: 'Telegram', icon: Send, onClick: () => shareOnPlatform('telegram'), bgColor: 'bg-[#E7F3FF]', iconColor: 'text-[#0088cc]' }
          ].map((platform) => (
            <button
              key={platform.name}
              onClick={platform.onClick}
              className="flex flex-col items-center group"
              disabled={!referralLink}
            >
              <div className={`p-3 rounded-full transition-transform group-hover:scale-110 ${platform.bgColor}`}>
                <platform.icon className={`h-5 w-5 ${platform.iconColor}`} />
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {platform.name}
              </span>
            </button>
          ))}
        </div>
          </div>
    </div>
  );
} 