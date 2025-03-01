import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import SupabaseDebugLinks from '../components/supabase-debug-links';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <div className="w-64 shrink-0">
              <div className="sticky top-20">
                <Sidebar />
              </div>
            </div>
            <main className="flex-1 py-8">
              <div className="flex-1 overflow-auto">
                {children}
                <SupabaseDebugLinks />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
} 