import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import SupabaseDebugLinks from '../components/supabase-debug-links';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | SuperIntern',
  description: 'Manage your internship journey',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16">
        <Sidebar className="w-64 fixed left-0 top-16 bottom-0" />
        <div className="pl-64 w-full">
          <main className="container mx-auto max-w-7xl p-6">
            {children}
            <SupabaseDebugLinks />
          </main>
        </div>
      </div>
    </div>
  );
} 