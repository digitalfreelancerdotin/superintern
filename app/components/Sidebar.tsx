"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LayoutDashboard, ListPlus, CheckSquare, Users, PlusCircle, ClipboardList, UserCog, FileText } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function checkUserStatus() {
      if (!user) return;

      const supabase = createClientComponentClient();
      try {
        const { data: profile, error } = await supabase
          .from('intern_profiles')
          .select('is_admin, is_active')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking user status:', error);
          return;
        }

        setIsAdmin(profile?.is_admin || false);
        setIsActive(profile?.is_active ?? true);

        // If user is inactive and not on the suspended page, redirect them
        if (!profile?.is_active && pathname !== '/dashboard/suspended') {
          router.push('/dashboard/suspended');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    checkUserStatus();
  }, [user, pathname]);

  // Base navigation items (visible to active users)
  const baseNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Open Tasks",
      href: "/dashboard/open-tasks",
      icon: ListPlus,
      current: pathname === "/dashboard/open-tasks",
    },
    {
      name: "My Tasks",
      href: "/dashboard/tasks",
      icon: CheckSquare,
      current: pathname === "/dashboard/tasks",
    },
    {
      name: "Referrals",
      href: "/dashboard/referrals",
      icon: Users,
      current: pathname === "/dashboard/referrals",
    },
  ];

  // Admin-only navigation items
  const adminNavigation = [
    {
      name: "Create Task",
      href: "/dashboard/tasks/create",
      icon: PlusCircle,
      current: pathname === "/dashboard/tasks/create",
    },
    {
      name: "Task Applications",
      href: "/dashboard/task-applications",
      icon: ClipboardList,
      current: pathname === "/dashboard/task-applications",
    },
    {
      name: "Manage Interns",
      href: "/dashboard/interns",
      icon: UserCog,
      current: pathname === "/dashboard/interns",
    },
    {
      name: "Internship Requests",
      href: "/dashboard/internship-requests",
      icon: FileText,
      current: pathname === "/dashboard/internship-requests",
    },
  ];

  // If user is inactive, only show dashboard that redirects to suspended page
  if (!isActive) {
    return (
      <div className="h-full bg-background">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              <Link
                href="/dashboard/suspended"
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 gap-3',
                  pathname === '/dashboard/suspended' ? 'bg-slate-100' : 'transparent'
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Combine navigation items based on user role for active users
  const navigation = [...baseNavigation, ...(isAdmin ? adminNavigation : [])];

  return (
    <div className="h-full bg-background">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 gap-3',
                  pathname === link.href ? 'bg-slate-100' : 'transparent'
                )}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 