"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/auth-context";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

interface TaskApplication {
  id: string;
  task_id: string;
  applicant_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  notes: string | null;
  task: {
    title: string;
    points: number;
    payment_amount: number;
    is_paid: boolean;
  };
  applicant: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function TaskApplicationsPage() {
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    try {
      // First check if user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('intern_profiles')
        .select('is_admin')
        .eq('user_id', user!.id)
        .single();

      if (adminError) throw adminError;
      if (!adminCheck?.is_admin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get all pending applications with task and applicant details
      const { data, error } = await supabase
        .from('task_applications')
        .select(`
          *,
          task:tasks (
            title,
            points,
            payment_amount,
            is_paid
          ),
          applicant:intern_profiles (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationUpdate = async (applicationId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ 
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Application ${status}`,
      });

      // Reload applications to get updated data
      await loadApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Task Applications</h1>
      
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Applied At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.task.title}</TableCell>
                <TableCell>
                  {app.applicant.first_name} {app.applicant.last_name}
                  <br />
                  <span className="text-sm text-gray-500">{app.applicant.email}</span>
                </TableCell>
                <TableCell>{app.task.points}</TableCell>
                <TableCell>
                  {app.task.is_paid ? `$${app.task.payment_amount}` : 'No payment'}
                </TableCell>
                <TableCell>
                  {new Date(app.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span className={`capitalize ${
                    app.status === 'approved' ? 'text-green-600' :
                    app.status === 'rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {app.status}
                  </span>
                </TableCell>
                <TableCell>
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApplicationUpdate(app.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApplicationUpdate(app.id, 'rejected', 'Application rejected by admin')}
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No task applications found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 