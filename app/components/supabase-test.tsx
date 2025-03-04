'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { supabase, validateConnection } from '../lib/supabase';

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runConnectionTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('Running Supabase connection test...');
      
      // Test 1: Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Environment variables:');
      console.log('- URL:', supabaseUrl);
      console.log('- Key:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'missing');
      
      if (!supabaseUrl || !supabaseKey) {
        setTestResult({
          success: false,
          message: 'Missing Supabase environment variables',
          details: { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey }
        });
        return;
      }
      
      // Test 2: Basic auth check
      console.log('Testing auth functionality...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session test result:', {
        hasSession: !!sessionData?.session,
        error: sessionError
      });
      
      // Test 3: Run the validateConnection function
      console.log('Running validateConnection...');
      const isConnected = await validateConnection();
      
      console.log('validateConnection result:', isConnected);
      
      if (!isConnected) {
        setTestResult({
          success: false,
          message: 'Connection validation failed',
          details: { sessionData, sessionError }
        });
        return;
      }
      
      // Test 4: Try a simple query
      console.log('Testing simple query...');
      const { data, error } = await supabase
        .from('intern_profiles')
        .select('count');
      
      console.log('Query result:', { data, error });
      
      if (error) {
        setTestResult({
          success: false,
          message: `Query failed: ${error.message}`,
          details: { error, sessionData }
        });
        return;
      }
      
      // All tests passed
      setTestResult({
        success: true,
        message: 'All connection tests passed!',
        details: { data, sessionData }
      });
      
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: { error }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <Button 
        onClick={runConnectionTest} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Run Connection Test'}
      </Button>
      
      {testResult && (
        <div className={`p-4 rounded ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <h3 className={`font-bold ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {testResult.success ? 'Success' : 'Error'}
          </h3>
          <p className="mb-2">{testResult.message}</p>
          {testResult.details && (
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(testResult.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </Card>
  );
} 