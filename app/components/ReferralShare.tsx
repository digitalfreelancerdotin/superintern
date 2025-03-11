"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Copy, Twitter, Facebook, MessageCircle, Send, Link, Users, UserCheck, Award } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";

export function ReferralShare() {
  const [referralCode] = useState<string>("SS0XDBm7");
  const [referralLink, setReferralLink] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // This will get the current domain whether it's localhost or the production domain
    const baseUrl = window.location.origin;
    setReferralLink(`${baseUrl}/signup?ref=${referralCode}`);
  }, [referralCode]);

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

  const socialPlatforms = [
    { name: 'Share link', icon: <Link className="h-5 w-5" />, onClick: copyToClipboard, bgColor: 'bg-[#F4F4F5]', iconColor: 'text-gray-600' },
    { name: 'Twitter', icon: <Twitter className="h-5 w-5" />, onClick: () => shareOnPlatform('twitter'), bgColor: 'bg-[#E8F5FD]', iconColor: 'text-[#1DA1F2]' },
    { name: 'Facebook', icon: <Facebook className="h-5 w-5" />, onClick: () => shareOnPlatform('facebook'), bgColor: 'bg-[#E7F3FF]', iconColor: 'text-[#1877F2]' },
    { name: 'WhatsApp', icon: <MessageCircle className="h-5 w-5" />, onClick: () => shareOnPlatform('whatsapp'), bgColor: 'bg-[#E7FFE7]', iconColor: 'text-[#25D366]' },
    { name: 'Telegram', icon: <Send className="h-5 w-5" />, onClick: () => shareOnPlatform('telegram'), bgColor: 'bg-[#E7F3FF]', iconColor: 'text-[#0088cc]' },
  ];

  const shareOnPlatform = (platform: string) => {
    const text = `Join me on SuperInterns!`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + referralLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
    };
    window.open(urls[platform]);
  };

  const stats = [
    {
      title: "Total Referrals",
      value: "0",
      icon: Users,
      description: "People who used your referral link"
    },
    {
      title: "Successful Joins",
      value: "0",
      icon: UserCheck,
      description: "People who joined using your link"
    },
    {
      title: "Points Earned",
      value: "0",
      icon: Award,
      description: "Reward points from referrals"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Share SuperInterns</h2>
          <div className="space-y-6">
            <div className="flex items-center p-3 bg-muted rounded-lg w-fit">
              <div className="text-sm text-muted-foreground">
                {referralLink}
          </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-background ml-2"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

            <div className="flex flex-wrap gap-4">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={platform.onClick}
                  className="flex flex-col items-center group"
                >
                  <div className={cn(
                    "p-3 rounded-full transition-transform group-hover:scale-110",
                    platform.bgColor
                  )}>
                    <div className={platform.iconColor}>
                      {platform.icon}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Your Referrals</h2>
          <div className="space-y-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className="text-sm font-medium">{stat.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 