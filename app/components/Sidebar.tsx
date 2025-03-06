"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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
      }
    }

    checkAdminStatus();
  }, [user]);

  // Define all possible links
  const allLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      showFor: 'all' // Show for both admin and users
    },
    {
      href: '/dashboard/intern/profile',
      label: 'Profile',
      showFor: 'all' // Show for both admin and users
    },
    {
      href: '/dashboard/admin/tasks',
      label: 'Assign Tasks',
      showFor: 'admin' // Only show for admin
    },
    {
      href: '/dashboard/intern/tasks',
      label: 'My Tasks',
      showFor: 'user' // Only show for regular users
    }
  ];

  // Filter links based on user role
  const visibleLinks = allLinks.filter(link => {
    if (link.showFor === 'all') return true;
    if (link.showFor === 'admin') return isAdmin;
    if (link.showFor === 'user') return !isAdmin;
    return false;
  });

  return (
    <div className="pb-12 h-full">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100',
                  pathname === link.href ? 'bg-slate-100' : 'transparent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 