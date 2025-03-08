import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import { Share2, Copy, Twitter, Facebook, Linkedin } from 'lucide-react';

export function ReferralShare() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    loadReferralCode();
  }, []);

  const loadReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      console.log('Fetching referral code for user:', user.id);

      // Check if user already has a referral code
      const { data: existingCodes, error: fetchError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching referral code:', fetchError);
        return;
      }

      // If user has any existing codes, use the first one
      if (existingCodes && existingCodes.length > 0) {
        console.log('Found existing code:', existingCodes[0].code);
        setReferralCode(existingCodes[0].code);
        
        // If somehow multiple codes exist, clean up duplicates
        if (existingCodes.length > 1) {
          console.log('Found multiple codes, cleaning up duplicates...');
          const keepCode = existingCodes[0].code;
          const { error: deleteError } = await supabase
            .from('referral_codes')
            .delete()
            .eq('user_id', user.id)
            .neq('code', keepCode);

          if (deleteError) {
            console.error('Error cleaning up duplicate codes:', deleteError);
          }
        }
      } else {
        console.log('No existing code found, generating new one');
        // Generate new referral code
        const newCode = generateReferralCode();
        
        // Use upsert to prevent race conditions
        const { data: insertedCode, error: insertError } = await supabase
          .from('referral_codes')
          .upsert({
            user_id: user.id,
            code: newCode
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: true
          })
          .select('code')
          .single();

        if (insertError) {
          console.error('Error creating referral code:', insertError);
          return;
        }

        if (insertedCode) {
          console.log('New code created:', insertedCode.code);
          setReferralCode(insertedCode.code);
        }
      }
    } catch (error) {
      console.error('Error in loadReferralCode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = () => {
    // Generate a random 8-character code with timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36).substring(0, 2);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${random}${timestamp}`;
  };

  const getReferralLink = () => {
    if (!referralCode) return '';
    
    // Use NEXT_PUBLIC_SITE_URL in both development and production
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${baseUrl}/signup?ref=${referralCode}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent("Join TopInterns and start your journey! Use my referral link:");
    const url = encodeURIComponent(getReferralLink());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(getReferralLink());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(getReferralLink());
    const title = encodeURIComponent("Join TopInterns - Start Your Journey!");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent("Join TopInterns and start your journey! Use my referral link: " + getReferralLink());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="p-4 text-center">
          <p>Loading your referral link...</p>
        </div>
      ) : !referralCode ? (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          <p>There was an error loading your referral link. Please refresh the page to try again.</p>
        </div>
      ) : (
        <>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Share this link:</p>
            <p className="font-mono text-sm break-all">{getReferralLink()}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600"
              onClick={shareOnWhatsApp}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.653-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600"
              onClick={shareOnLinkedIn}
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-600"
              onClick={shareOnTwitter}
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
              onClick={shareOnFacebook}
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 