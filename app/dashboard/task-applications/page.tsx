"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/auth-context";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Textarea } from "@/app/components/ui/textarea";

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
  const [selectedApp, setSelectedApp] = useState<{
    app: TaskApplication | null;
    action: 'approved' | 'rejected' | null;
  }>({ app: null, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  
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

      // Get all applications with task and applicant details
      const { data, error } = await supabase
        .from('task_applications')
        .select(`
          id,
          task_id,
          applicant_id,
          status,
          created_at,
          notes,
          tasks (
            title,
            points,
            payment_amount,
            is_paid
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get the applicant details in a separate query
      const applicantIds = [...new Set((data || []).map(app => app.applicant_id))];
      const { data: applicantData, error: applicantError } = await supabase
        .from('intern_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', applicantIds);

      if (applicantError) throw applicantError;

      // Create a map of applicant details
      const applicantMap = new Map(
        applicantData?.map(profile => [profile.user_id, profile]) || []
      );

      // Transform the data to match our interface
      const transformedData = (data || []).map(app => {
        const applicantProfile = applicantMap.get(app.applicant_id);
        const taskData = Array.isArray(app.tasks) ? app.tasks[0] : app.tasks;
        return {
          id: app.id,
          task_id: app.task_id,
          applicant_id: app.applicant_id,
          status: app.status as TaskApplication['status'],
          created_at: app.created_at,
          notes: app.notes,
          task: {
            title: taskData?.title || '',
            points: taskData?.points || 0,
            payment_amount: taskData?.payment_amount || 0,
            is_paid: taskData?.is_paid || false
          },
          applicant: {
            first_name: applicantProfile?.first_name || '',
            last_name: applicantProfile?.last_name || '',
            email: applicantProfile?.email || ''
          }
        };
      });

      setApplications(transformedData);
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
          notes
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
                        onClick={() => setSelectedApp({ app, action: 'approved' })}
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => setSelectedApp({ app, action: 'rejected' })}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
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

      <AlertDialog open={selectedApp.app !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedApp({ app: null, action: null });
          setRejectionReason('');
        }
      }}>
        <AlertDialogContent className="bg-white dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedApp.action === 'approved' ? 'Approve Application' : 'Reject Application'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {selectedApp.app && (
                <div className="space-y-4">
                  <div>
                    Are you sure you want to {selectedApp.action === 'approved' ? 'approve' : 'reject'} the application for "{selectedApp.app.task.title}" from {selectedApp.app.applicant.first_name} {selectedApp.app.applicant.last_name}?
                  </div>
                  {selectedApp.action === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Rejection Reason (will be sent to the applicant):
                      </label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedApp({ app: null, action: null });
              setRejectionReason('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedApp.app && selectedApp.action) {
                  if (selectedApp.action === 'rejected' && !rejectionReason.trim()) {
                    toast({
                      title: "Error",
                      description: "Please provide a reason for rejection",
                      variant: "destructive",
                    });
                    return;
                  }

                  await handleApplicationUpdate(
                    selectedApp.app.id,
                    selectedApp.action,
                    selectedApp.action === 'rejected' ? rejectionReason : undefined
                  );

                  if (selectedApp.action === 'rejected') {
                    const { error: taskError } = await supabase
                      .from('tasks')
                      .update({ status: 'open' })
                      .eq('id', selectedApp.app.task_id);

                    if (taskError) {
                      console.error('Error updating task status:', taskError);
                      toast({
                        title: "Warning",
                        description: "Application rejected but there was an error updating task status",
                        variant: "destructive",
                      });
                    }
                  }

                  setSelectedApp({ app: null, action: null });
                  setRejectionReason('');
                }
              }}
              className={selectedApp.action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {selectedApp.action === 'approved' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 