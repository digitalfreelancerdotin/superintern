'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

interface AuthCallbackProps {
  error?: string | null;
}

export function AuthCallback({ error: initialError }: AuthCallbackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(initialError || null);

  useEffect(() => {
    // Check if there's an error parameter in the URL if no initial error was provided
    if (!initialError) {
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (errorParam) {
        setError(errorDescription || 'Authentication failed. Please try again.');
      }
    }
  }, [searchParams, initialError]);

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardContent className="pt-6">
        {error ? (
          <div className="text-center py-4">
            <h3 className="text-lg font-medium text-red-600 mb-2">Authentication Error</h3>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <h3 className="text-lg font-medium mb-2">Authenticating...</h3>
            <p className="text-muted-foreground">Please wait while we log you in.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 