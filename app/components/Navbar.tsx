"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuthButton } from "@/app/components/auth/auth-button"
import { useAuth } from '../context/auth-context';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('intern_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setIsAdmin(data.is_admin);
        }
      }
    }
    checkAdminStatus();
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 border-b bg-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-2xl">⬇️</span>
                <span className="text-xl font-bold">TopInterns</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Link href="/dashboard/intern/profile" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Profile
                </Link>
                {isAdmin && (
                  <Link href="/dashboard/admin/tasks" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                    Tasks
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 