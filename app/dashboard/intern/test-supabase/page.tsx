'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { testSupabaseConnection, testSupabaseWrite, testSupabaseRead } from '../../../lib/supabase-test';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

export default function TestSupabasePage() {
  const { user, isLoaded } = useUser();
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [writeResult, setWriteResult] = useState<any>(null);
  const [readResult, setReadResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test the connection to Supabase
  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionResult(result);
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionResult({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  // Test writing data to Supabase
  const testWrite = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const result = await testSupabaseWrite(user.id);
      setWriteResult(result);
    } catch (error) {
      console.error('Error testing write:', error);
      setWriteResult({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  // Test reading data from Supabase
  const testRead = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const result = await testSupabaseRead(user.id);
      setReadResult(result);
    } catch (error) {
      console.error('Error testing read:', error);
      setReadResult({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  // Run all tests sequentially
  const runAllTests = async () => {
    if (!user) return;
    await testConnection();
    await testWrite();
    await testRead();
  };

  // Format JSON for display
  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supabase Test Page</h1>
        <div className="flex gap-2">
          <a href="/dashboard" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
            Back to Dashboard
          </a>
          <a href="/dashboard/intern/setup-supabase" className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded">
            Setup Supabase
          </a>
        </div>
      </div>

      {!isLoaded ? (
        <p>Loading user...</p>
      ) : !user ? (
        <div className="bg-yellow-100 p-4 rounded mb-4">
          <p className="font-medium">Please log in to run tests.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={runAllTests} 
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button 
              onClick={testConnection} 
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button 
              onClick={testWrite} 
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Write
            </button>
            <button 
              onClick={testRead} 
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Test Read
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Test Results */}
            <div className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Connection Test</h2>
              {connectionResult ? (
                <div>
                  <div className={`p-2 rounded mb-2 ${connectionResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    Status: {connectionResult.success ? 'Success' : 'Failed'}
                  </div>
                  <div className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                    <pre className="text-sm">{JSON.stringify(connectionResult, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No results yet</p>
              )}
            </div>

            {/* Write Test Results */}
            <div className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Write Test</h2>
              {writeResult ? (
                <div>
                  <div className={`p-2 rounded mb-2 ${writeResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    Status: {writeResult.success ? 'Success' : 'Failed'}
                  </div>
                  <div className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                    <pre className="text-sm">{JSON.stringify(writeResult, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No results yet</p>
              )}
            </div>

            {/* Read Test Results */}
            <div className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Read Test</h2>
              {readResult ? (
                <div>
                  <div className={`p-2 rounded mb-2 ${readResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    Status: {readResult.success ? 'Success' : 'Failed'}
                  </div>
                  <div className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                    <pre className="text-sm">{JSON.stringify(readResult, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No results yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 