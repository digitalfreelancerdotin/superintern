"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/auth-context";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { useToast } from "@/app/components/ui/use-toast";
import { createTask, CreateTaskData, getAllTasks, Task } from "@/app/lib/tasks";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ArrowUpDown, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SortField = 'title' | 'points' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface TaskWithIntern extends Task {
  intern_profiles: {
    email: string;
    first_name: string;
    last_name: string;
    total_points: number;
  } | null;
}

export default function AdminTasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [tasks, setTasks] = useState<TaskWithIntern[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingTask, setEditingTask] = useState<TaskWithIntern | null>(null);

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    points: 0,
    is_paid: false,
    payment_amount: undefined as number | undefined
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeData = async () => {
      if (!user) {
        console.log('No user found, skipping data load');
        return;
      }

      try {
        console.log('Checking Supabase session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast({
            title: "Authentication Error",
            description: "Please try logging in again",
            variant: "destructive",
          });
          return;
        }

        if (!session) {
          console.log('No active session found');
          toast({
            title: "Session Expired",
            description: "Please log in again",
            variant: "destructive",
          });
          return;
        }

        console.log('Session found, loading data...');
        await loadTasks();
        await loadInterns();
      } catch (e) {
        console.error('Initialization error:', e);
        toast({
          title: "Error",
          description: "Failed to initialize dashboard",
          variant: "destructive",
        });
      }
    };

    initializeData();
  }, [user]);

  const loadTasks = async () => {
    console.log('1. Starting task load...');
    
    try {
      console.log('2. Checking session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('3. Session:', session?.user?.email);

      console.log('4. Making basic query...');
      const result = await supabase
        .from('tasks')
        .select('*');
      
      console.log('5. Query result:', {
        status: result.status,
        statusText: result.statusText,
        error: result.error
      });

      if (result.error) {
        console.log('6. Query error:', result.error);
        throw result.error;
      }

      if (!result.data) {
        console.log('7. No data found');
        setTasks([]);
        return;
      }

      console.log('8. Got tasks:', result.data.length);

      // Now try the join query
      console.log('9. Attempting join query...');
      const joinResult = await supabase
        .from('tasks')
        .select(`
          *,
          intern_profiles!tasks_assigned_to_fkey (
            email,
            first_name,
            last_name,
            total_points
          )
        `);

      console.log('10. Join query result:', {
        status: joinResult.status,
        statusText: joinResult.statusText,
        error: joinResult.error
      });

      if (joinResult.error) {
        console.log('11. Join query error:', joinResult.error);
        throw joinResult.error;
      }

      const typedTasks = (joinResult.data || []) as TaskWithIntern[];
      console.log('12. Setting tasks:', typedTasks.length);
      setTasks(typedTasks);

    } catch (error) {
      console.log('13. Error caught:', error);
      console.error('Error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      toast({
        title: "Error loading tasks",
        description: error instanceof Error ? error.message : "Failed to load tasks",
        variant: "destructive",
      });
    }
  };

  const loadInterns = async () => {
    try {
      console.log('Loading interns...');
      const { data, error } = await supabase
        .from('intern_profiles')
        .select('user_id, email, first_name, last_name')
        .eq('is_admin', false);

      if (error) {
        throw error;
      }

      console.log(`Successfully loaded ${data?.length || 0} interns`);
      setInterns(data || []);
    } catch (error) {
      console.error('Error loading interns:', error);
      toast({
        title: "Error loading interns",
        description: error instanceof Error ? error.message : "Failed to load interns",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'title':
        return modifier * a.title.localeCompare(b.title);
      case 'points':
        return modifier * (a.points - b.points);
      case 'status':
        return modifier * a.status.localeCompare(b.status);
      case 'created_at':
        return modifier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return 0;
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const taskData: CreateTaskData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        points: parseInt(formData.get('points') as string) || 0,
        is_paid: isPaid,
        payment_amount: isPaid ? parseFloat(formData.get('payment_amount') as string) : undefined,
        assigned_to: formData.get('assigned_to') as string || undefined,
        created_by: user.id
      };

      await createTask(taskData);
      await loadTasks();

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      // Reset form
      (e.target as HTMLFormElement).reset();
      setIsPaid(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTask = async (taskId: string, assignedTo: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        assigned_to: assignedTo,
        status: 'assigned'
      })
      .eq('id', taskId);

    if (error) throw error;

    toast({
      title: "Success",
      description: "Task assigned successfully",
    });

    loadTasks(); // Reload tasks to show updated assignment
  };

  const approveTask = async (task: TaskWithIntern) => {
    if (!task.intern_profiles || task.status !== 'completed') {
      toast({
        title: "Cannot approve task",
        description: "Task must be completed before approval",
        variant: "destructive",
      });
      return;
    }

    try {
      // First update task status to approved
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      // Then award points to the intern
      const { error: pointsError } = await supabase
        .from('intern_points')
        .insert({
          intern_id: task.assigned_to,
          task_id: task.id,
          points_earned: task.points,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (pointsError) throw pointsError;

      toast({
        title: "Task approved",
        description: `Awarded ${task.points} points to ${task.intern_profiles.first_name}`,
      });

      loadTasks();
    } catch (error: any) {
      console.error('Error approving task:', error);
      toast({
        title: "Error approving task",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Task Management</h1>
      
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Task List</TabsTrigger>
          <TabsTrigger value="create">Create New Task</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort('title')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Title</span>
                        <ArrowUpDown size={16} />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">Description</th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort('points')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Points</span>
                        <ArrowUpDown size={16} />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">Payment</th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Status</span>
                        <ArrowUpDown size={16} />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">Assignment</th>
                    <th className="py-3 px-4 text-left">
                      <button 
                        onClick={() => handleSort('created_at')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Created</span>
                        <ArrowUpDown size={16} />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link 
                          href={`/dashboard/tasks/${task.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => {
                            console.log('Clicking task link:', {
                              id: task.id,
                              title: task.title
                            });
                          }}
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">{task.description}</td>
                      <td className="py-3 px-4">{task.points}</td>
                      <td className="py-3 px-4">
                        {task.is_paid ? `$${task.payment_amount}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs',
                          {
                            'bg-yellow-100 text-yellow-800': task.status === 'open',
                            'bg-blue-100 text-blue-800': task.status === 'assigned',
                            'bg-purple-100 text-purple-800': task.status === 'in_progress',
                            'bg-green-100 text-green-800': task.status === 'completed',
                            'bg-gray-100 text-gray-800': task.status === 'cancelled'
                          }
                        )}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {task.intern_profiles && (
                          <div className="text-sm">
                            <p className="font-medium">
                              {task.intern_profiles.first_name} {task.intern_profiles.last_name}
                            </p>
                            <p className="text-gray-500">
                              {task.intern_profiles.email}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(task.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {!task.intern_profiles && task.status === 'open' && (
                          <div className="flex items-center space-x-2">
                            {editingTask?.id === task.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  className="rounded-md border border-input bg-white px-3 py-1 text-sm text-black"
                                  onChange={(e) => {
                                    handleAssignTask(task.id, e.target.value);
                                    setEditingTask(null);
                                  }}
                                  defaultValue=""
                                >
                                  <option value="" disabled className="text-gray-500">Select intern</option>
                                  {interns.map((intern) => (
                                    <option key={intern.user_id} value={intern.user_id} className="bg-white text-black">
                                      {intern.first_name} {intern.last_name} ({intern.email})
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingTask(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingTask(task)}
                                className="flex items-center space-x-1"
                              >
                                <Edit size={16} />
                                <span>Assign</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length === 0 && (
                <p className="text-gray-500 text-center py-4">No tasks created yet.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Enter task title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Enter task description"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  name="points"
                  type="number"
                  min="0"
                  required
                  placeholder="Enter points value"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_paid"
                  name="is_paid"
                  checked={isPaid}
                  onCheckedChange={setIsPaid}
                />
                <Label htmlFor="is_paid">Is this a paid task?</Label>
              </div>

              {isPaid && (
                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Payment Amount ($)</Label>
                  <Input
                    id="payment_amount"
                    name="payment_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required={isPaid}
                    placeholder="Enter payment amount"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign to Intern (Optional)</Label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-black"
                >
                  <option value="">Select an intern</option>
                  {interns.map((intern) => (
                    <option key={intern.user_id} value={intern.user_id} className="text-black">
                      {intern.first_name} {intern.last_name} ({intern.email})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 