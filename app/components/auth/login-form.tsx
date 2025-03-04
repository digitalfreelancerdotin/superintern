'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/app/components/ui/use-toast';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const { success, error } = await signIn(email);
      
      if (success) {
        setIsSent(true);
        toast({
          title: 'Magic link sent',
          description: 'Check your email for the login link.',
        });
      } else {
        toast({
          title: 'Error',
          description: error || 'Failed to send magic link. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Sign in to your account using your email
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSent ? (
          <div className="text-center py-4">
            <h3 className="text-lg font-medium mb-2">Check your email</h3>
            <p className="text-muted-foreground mb-4">
              We've sent a magic link to <span className="font-medium">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to sign in to your account.
              The link will expire in 24 hours.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsSent(false)}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-muted-foreground">
          We'll email you a magic link for a password-free sign in.
        </p>
      </CardFooter>
    </Card>
  );
} 