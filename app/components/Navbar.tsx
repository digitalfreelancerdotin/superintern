"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuthButton } from "@/app/components/auth/auth-button"
import { useAuth } from '../context/auth-context';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
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

  useEffect(() => {
    if (user) {
      loadPoints();
    } else {
      setPoints(null);
    }
  }, [user]);

  const loadPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('intern_profiles')
        .select('total_points')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        console.error('Error loading points:', error);
        return;
      }

      setPoints(data?.total_points || 0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
            {user && points !== null && (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium">
                <Award className="h-4 w-4 text-yellow-600" />
                <span>{points} points</span>
              </div>
            )}
            {user ? (
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            ) : (
              <Button variant="outline" onClick={() => router.push("/auth/login")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 