import Navbar from "../components/Navbar";
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        <div className="w-64 min-h-screen border-r bg-background fixed left-0 top-16">
          <Sidebar />
        </div>
        <main className="flex-1 p-8 ml-64 bg-background">
          {children}
          <SupabaseDebugLinks />
        </main>
      </div>
    </div>
  );
} 