'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Task } from '../lib/tasks';
import { cn } from '@/lib/utils';
import { useToast } from '../components/ui/use-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return;

      const supabase = createClientComponentClient();
      try {
        const { data: profile, error } = await supabase
          .from('intern_profiles')
          .select('is_admin, first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }

        setIsAdmin(profile?.is_admin || false);
        setProfile(profile ? { first_name: profile.first_name, last_name: profile.last_name } : null);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) {
      console.log('Debug - No user found');
      return;
    }

    const supabase = createClientComponentClient();
    
    // Log the current user information
    console.log('Debug - Current user:', {
      id: user.id,
      email: user.email
    });

    try {
      // Step 1: Get tasks directly using user.id
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          points,
          is_paid,
          payment_amount,
          status,
          created_at,
          updated_at,
          assigned_to,
          created_by
        `)
        .eq('assigned_to', user.id);

      console.log('Debug - Tasks lookup:', {
        userId: user.id,
        tasks: tasksData,
        error: tasksError
      });

      if (tasksError) {
        console.error('Tasks fetch error:', tasksError);
        toast({
          title: "Error loading tasks",
          description: tasksError.message,
          variant: "destructive",
        });
        return;
      }

      // Verify the data before setting
      if (Array.isArray(tasksData)) {
        console.log('Debug - Setting tasks:', {
          count: tasksData.length,
          tasks: tasksData
        });
        setTasks(tasksData);
      } else {
        console.log('Debug - No tasks array returned:', tasksData);
        setTasks([]);
      }

    } catch (error: any) {
      console.error('Debug - Caught error:', {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      toast({
        title: "Error loading tasks",
        description: "Could not load your tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'in_progress' | 'completed' | 'blocked') => {
    const supabase = createClientComponentClient();
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Add comment if provided
      if (comment.trim()) {
        const { error: commentError } = await supabase
          .from('task_comments')
          .insert({
            task_id: taskId,
            content: comment,
            created_by: user?.id
          });

        if (commentError) throw commentError;
      }

      setComment('');
      setUpdatingTaskId(null);
      loadTasks(); // Reload tasks to show updates
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          {isAdmin ? (
            <span className="text-blue-600">Welcome, {profile?.first_name || 'Admin'}! 👋</span>
          ) : (
            <span>Welcome, {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}! 👋</span>
          )}
        </h1>
        
        {isAdmin && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-600">
              As an admin, you have access to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>View and manage all intern profiles</li>
              <li>Create and assign tasks</li>
              <li>Review submitted work</li>
              <li>Manage system settings</li>
            </ul>
          </div>
        )}

        <div className="mt-6">
          <p className="text-gray-600">
            {isAdmin 
              ? 'Use the navigation menu to access admin features.'
              : 'Check your tasks and update your profile using the navigation menu.'}
          </p>
        </div>
      </Card>

      {!isAdmin && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks assigned yet.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-sm">Points: {task.points}</span>
                        {task.is_paid && (
                          <span className="text-sm text-green-600">
                            Payment: ${task.payment_amount}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs',
                      {
                        'bg-blue-100 text-blue-800': task.status === 'assigned',
                        'bg-purple-100 text-purple-800': task.status === 'in_progress',
                        'bg-green-100 text-green-800': task.status === 'completed',
                        'bg-red-100 text-red-800': task.status === 'blocked'
                      }
                    )}>
                      {task.status}
                    </span>
                  </div>

                  {task.status !== 'completed' && (
                    <div className="space-y-3">
                      {updatingTaskId === task.id ? (
                        <>
                          <Textarea
                            placeholder="Add a comment about your progress..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                              variant="outline"
                              size="sm"
                            >
                              Mark In Progress
                            </Button>
                            <Button
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              variant="outline"
                              size="sm"
                              className="text-green-600"
                            >
                              Mark Complete
                            </Button>
                            <Button
                              onClick={() => updateTaskStatus(task.id, 'blocked')}
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                            >
                              Mark Blocked
                            </Button>
                            <Button
                              onClick={() => {
                                setUpdatingTaskId(null);
                                setComment('');
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          onClick={() => setUpdatingTaskId(task.id)}
                          variant="outline"
                          size="sm"
                        >
                          Update Status
                        </Button>
                      )}
                    </div>
                  )}

                  {task.comments && task.comments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Comments</h4>
                      {task.comments.map((comment: any) => (
                        <div key={comment.id} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                          <p>{comment.content}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 