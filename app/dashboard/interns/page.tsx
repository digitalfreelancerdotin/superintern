'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { useToast } from '@/app/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { InternTable } from '@/app/components/InternTable';

interface InternProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_points: number;
  is_active: boolean;
  is_admin: boolean;
}

export default function ManageInternsPage() {
  const [interns, setInterns] = useState<InternProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadInterns();
  }, []);

  const loadInterns = async () => {
    try {
      // First verify the current user is an admin
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: currentUserProfile, error: profileError } = await supabase
        .from('intern_profiles')
        .select('is_admin')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      if (!currentUserProfile?.is_admin) {
        toast({
          title: "Unauthorized",
          description: "Only admins can access this page",
          variant: "destructive",
        });
        router.push('/dashboard');
        return;
      }

      // Load all intern profiles
      const { data: internProfiles, error: internsError } = await supabase
        .from('intern_profiles')
        .select('*')
        .order('first_name');

      if (internsError) throw internsError;
      setInterns(internProfiles || []);
    } catch (error) {
      console.error('Error loading interns:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load interns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInternStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('intern_profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setInterns(interns.map(intern => 
        intern.user_id === userId 
          ? { ...intern, is_active: !currentStatus }
          : intern
      ));

      toast({
        title: "Success",
        description: `Intern status updated to ${!currentStatus ? 'active' : 'inactive'}`,
      });
    } catch (error) {
      console.error('Error toggling intern status:', error);
      toast({
        title: "Error",
        description: "Failed to update intern status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Manage Interns</h1>

      <h2 className="text-3xl font-bold mb-8">Interns Leaderboard</h2>
      <InternTable />

      <div className="space-y-4 mt-16">
        {interns.map((intern) => (
          <Card key={intern.user_id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">
                  {intern.first_name} {intern.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{intern.email}</p>
                <p className="text-sm mt-1">
                  Points: <span className="font-medium">{intern.total_points || 0}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground mr-2">
                  {intern.is_active ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={intern.is_active}
                  onCheckedChange={() => toggleInternStatus(intern.user_id, intern.is_active)}
                  disabled={intern.is_admin}
                  aria-label="Toggle intern active status"
                />
              </div>
            </div>
          </Card>
        ))}

        {interns.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No interns found.
          </p>
        )}
      </div>
    </div>
  );
} 