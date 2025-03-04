'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ClientRedirect({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter();
  
  useEffect(() => {
    router.replace(redirectUrl);
  }, [router, redirectUrl]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">SuperIntern</h1>
          <p className="mt-2 text-sm text-gray-600">
            Redirecting you...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 