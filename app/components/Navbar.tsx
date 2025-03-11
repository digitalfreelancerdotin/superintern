"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuthButton } from "@/app/components/auth/auth-button"
import { useAuth } from '../context/auth-context';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, usePathname } from "next/navigation";
import { Award, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/app/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

export function Navbar({ className }: { className?: string }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const supabase = createClientComponentClient();
  const { theme, setTheme } = useTheme();

  // Check if we're in the dashboard section
  const isDashboard = pathname?.startsWith('/dashboard');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
    <header className={cn("border-b bg-background h-16", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-2xl">⬇️</span>
                <span className="text-xl font-bold">SuperInterns</span>
              </div>
            </Link>
          </div>
          
          {/* Only show navigation items if not in dashboard */}
          {!isDashboard && (
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('hero')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                How does it work
              </button>
              <button 
                onClick={() => scrollToSection('leaderboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Leaderboard
              </button>
              <button 
                onClick={() => scrollToSection('tasks')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Internships
              </button>
              <button 
                onClick={() => scrollToSection('stats')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Hire a Super Intern
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {isDashboard && <ThemeToggle />}
            {user && points !== null && (
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm font-medium">
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
    </header>
  )
} 