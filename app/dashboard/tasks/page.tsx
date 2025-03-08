"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/auth-context";
import { Card } from "@/app/components/ui/card";
import { useToast } from "@/app/components/ui/use-toast";
import { Task } from "@/app/lib/tasks";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

interface TaskWithDetails extends Task {
  intern_profiles: {
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          intern_profiles!tasks_assigned_to_fkey (
            email,
            first_name,
            last_name
          )
        `)
        .eq('assigned_to', user?.id)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load your tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in to view this page.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8">Loading your tasks...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Link 
            key={task.id} 
            href={`/dashboard/tasks/${task.id}`}
            className="block"
          >
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-800">
                    {task.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span>Points: {task.points}</span>
                    {task.is_paid && (
                      <span>Payment: ${task.payment_amount}</span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </Card>
          </Link>
        ))}

        {tasks.length === 0 && (
          <Card className="p-6">
            <p className="text-gray-500 text-center">No tasks assigned to you yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
} 