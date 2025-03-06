'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '../components/ui/card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | SuperIntern',
  description: 'Manage your internship journey',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return;

      const supabase = createClientComponentClient();
      try {
        const { data: profile, error } = await supabase
          .from('intern_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }

        setIsAdmin(profile?.is_admin || false);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          {isAdmin ? (
            <span className="text-blue-600">Welcome, Admin! 👋</span>
          ) : (
            'Welcome to your Dashboard'
          )}
        </h1>
        
        {isAdmin && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-600">
              As an admin, you have access to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>View and manage all intern profiles</li>
              <li>Create and assign tasks</li>
              <li>Review submitted work</li>
              <li>Manage system settings</li>
            </ul>
          </div>
        )}

        <div className="mt-6">
          <p className="text-gray-600">
            {isAdmin 
              ? 'Use the navigation menu to access admin features.'
              : 'Check your tasks and update your profile using the navigation menu.'}
          </p>
        </div>
      </Card>
    </div>
  );
} 