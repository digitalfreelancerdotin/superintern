'use client';

import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export default function SetupSupabasePage() {
  const [status, setStatus] = useState('idle');

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supabase Setup</h1>
        <div className="flex gap-2">
          <a href="/dashboard" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
            Back to Dashboard
          </a>
          <a href="/dashboard/intern/test-supabase" className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded">
            Test Connection
          </a>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
        <p className="mb-4">
          Follow these steps to set up your Supabase database:
        </p>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          <li>Create a Supabase account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">supabase.com</a></li>
          <li>Create a new project</li>
          <li>Copy your Supabase URL and anon key</li>
          <li>Create a .env.local file in the root of your project</li>
          <li>Add your Supabase credentials to the .env.local file</li>
        </ol>
        <Button 
          onClick={() => setStatus('success')}
          className="bg-green-500 hover:bg-green-600"
        >
          Verify Setup
        </Button>
      </Card>

      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Success!</p>
          <p>Your Supabase setup is complete.</p>
        </div>
      )}
    </div>
  );
} 