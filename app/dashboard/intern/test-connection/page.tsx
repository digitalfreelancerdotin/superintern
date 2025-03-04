'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateConnection } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/auth-context';

export default function TestConnectionPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [envVars, setEnvVars] = useState<{
    supabaseUrl: string | null;
    supabaseKeyPartial: string | null;
  }>({
    supabaseUrl: null,
    supabaseKeyPartial: null
  });

  useEffect(() => {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setEnvVars({
      supabaseUrl: url || null,
      supabaseKeyPartial: key ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : null
    });
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionResult(null);
    
    try {
      console.log('Testing Supabase connection...');
      
      // Check environment variables first
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setConnectionResult({
          success: false,
          message: 'Missing Supabase credentials in environment variables',
          details: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          }
        });
        return;
      }
      
      // Test connection
      const isConnected = await validateConnection();
      
      if (isConnected) {
        setConnectionResult({
          success: true,
          message: 'Successfully connected to Supabase'
        });
      } else {
        setConnectionResult({
          success: false,
          message: 'Failed to connect to Supabase'
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {envVars.supabaseUrl || 'Not set'}
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {envVars.supabaseKeyPartial || 'Not set'}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email || 'No email'}</div>
              <div><strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</div>
            </div>
          ) : (
            <div>Not logged in</div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {connectionResult && (
            <div className={`p-4 rounded ${connectionResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className={`font-bold ${connectionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {connectionResult.success ? 'Success' : 'Error'}
              </h3>
              <p>{connectionResult.message}</p>
              {connectionResult.details && (
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(connectionResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 