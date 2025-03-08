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

interface OpenTask {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  created_at: string;
  payment_amount: number;
  is_paid: boolean;
  application_status?: string;
}

export default function OpenTasksPage() {
  const [tasks, setTasks] = useState<OpenTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      loadOpenTasks();
    }
  }, [user]);

  const loadOpenTasks = async () => {
    try {
      // Get all open tasks
      const { data: openTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .is('assigned_to', null);

      if (tasksError) throw tasksError;

      // Get user's applications for these tasks
      const { data: applications, error: applicationsError } = await supabase
        .from('task_applications')
        .select('task_id, status')
        .eq('applicant_id', user!.id);

      if (applicationsError) throw applicationsError;

      // Create a map of task_id to application status
      const applicationMap = new Map(
        applications?.map(app => [app.task_id, app.status]) || []
      );

      // Combine tasks with application status
      const tasksWithApplicationStatus = openTasks?.map(task => ({
        ...task,
        application_status: applicationMap.get(task.id)
      }));

      setTasks(tasksWithApplicationStatus || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load open tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: taskId,
          applicant_id: user!.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application submitted successfully",
      });

      // Reload tasks to update status
      await loadOpenTasks();
    } catch (error) {
      console.error('Error applying for task:', error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Open Tasks</h1>
      
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>{task.points}</TableCell>
                <TableCell>
                  {task.is_paid ? `$${task.payment_amount}` : 'No payment'}
                </TableCell>
                <TableCell>
                  {task.application_status ? (
                    <span className="capitalize">
                      Application {task.application_status}
                    </span>
                  ) : (
                    'Not applied'
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleApply(task.id)}
                    disabled={!!task.application_status}
                    variant={task.application_status ? "secondary" : "default"}
                  >
                    {task.application_status ? 'Applied' : 'Apply'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No open tasks available at the moment
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 