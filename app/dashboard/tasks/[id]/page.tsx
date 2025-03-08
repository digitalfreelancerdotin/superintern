"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/auth-context";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import { Task } from "@/app/lib/tasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { handleReferralTaskCompletion } from '@/app/lib/referral-utils';

interface TaskWithDetails extends Omit<Task, 'comments'> {
  intern_profiles: {
    email: string;
    first_name: string;
    last_name: string;
    total_points: number;
  } | null;
  approved_at: string | null;
  comments: {
    id: string;
    task_id: string;
    content: string;
    created_at: string;
    created_by: string;
    parent_id: string | null;
    replies?: any[];
    user: {
      first_name: string;
      last_name: string;
    } | null;
  }[];
}

interface ThreadComment {
  id: string;
  content: string;
  created_at: string;
  replies?: ThreadComment[];
}

// Define the exact status values that match the database enum
type TaskStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'blocked' | 'cancelled';

export default function TaskDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      console.log('TaskDetailsPage mounted with ID:', id);
      if (!id) {
        console.error('No task ID provided');
        toast({
          title: "Error",
          description: "No task ID provided",
          variant: "destructive",
        });
        return;
      }

      if (user) {
        try {
          await loadTask();
          if (isSubscribed) {
            await checkAdminStatus();
          }
        } catch (error) {
          console.error('Error loading data:', error);
        }
      } else {
        console.log('No user found, waiting for auth...');
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [user, id, toast]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('intern_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return;
    }

    setIsAdmin(data?.is_admin || false);
  };

  const loadTask = async () => {
    try {
      console.log('Starting task load with ID:', id);
      
      if (!id || !user) {
        throw new Error('No task ID provided or user not authenticated');
      }

      // First get admin status
      const { data: adminData, error: adminError } = await supabase
        .from('intern_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) {
        console.error('Admin check error:', adminError);
        toast({
          title: "Warning",
          description: "Error checking admin status. Proceeding with limited access.",
          variant: "default",
        });
      }

      const isUserAdmin = adminData?.is_admin || false;
      console.log('User admin status:', isUserAdmin);

      // Step 1: Get the task with profiles joined
      const { data: basicTask, error: basicError } = await supabase
        .from('tasks')
        .select(`
          *,
          intern_profiles:assigned_to (
            user_id,
            email,
            first_name,
            last_name,
            total_points
          )
        `)
        .eq('id', id)
        .single();

      if (basicError || !basicTask) {
        console.error('Task load error:', basicError);
        throw new Error(basicError?.message || 'Task not found');
      }

      // Check permissions only if we're sure user is not admin
      if (!isUserAdmin && adminData !== null) {
        const hasPermission = basicTask.assigned_to === user.id || basicTask.created_by === user.id;
        if (!hasPermission) {
          throw new Error('You do not have permission to view this task');
        }
      }

      // Initialize selectedStatus with current task status
      setSelectedStatus(basicTask.status as TaskStatus);

      // Step 2: Get comments
      let sortedThreads: any[] = [];
      try {
        console.log('Fetching comments for task:', id);
        // First get comments without joins
        const { data: comments, error: commentsError } = await supabase
          .from('task_comments')
          .select('*')
          .eq('task_id', id)
          .order('created_at', { ascending: true });

        console.log('Basic comments query result:', {
          success: !!comments,
          error: commentsError,
          commentCount: comments?.length || 0
        });

        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
          toast({
            title: "Warning",
            description: "Unable to load comments. The task details will still be displayed.",
            variant: "default",
          });
        } else if (comments && Array.isArray(comments)) {
          // Get user info for each comment
          const userIds = [...new Set(comments.map(c => c.created_by))];
          console.log('Unique user IDs from comments:', userIds);

          const { data: profiles, error: profilesError } = await supabase
            .from('intern_profiles')
            .select('user_id, email, first_name, last_name')
            .in('user_id', userIds);

          console.log('Profiles query result:', {
            success: !!profiles,
            error: profilesError,
            count: profiles?.length || 0
          });

          const userMap = new Map(
            (profiles || []).map(profile => [
              profile.user_id,
              {
                first_name: profile.first_name || 'Unknown',
                last_name: profile.last_name || 'User'
              }
            ])
          );

          // Process comments with user info
          const processedComments = comments.map(comment => ({
            ...comment,
            user: userMap.get(comment.created_by) || { first_name: 'Unknown', last_name: 'User' }
          }));

          // Organize comments into threads
          const threadedComments = processedComments.reduce((acc, comment) => {
            if (!comment.parent_id) {
              acc[comment.id] = {
                ...comment,
                replies: acc[comment.id]?.replies || []
              };
            } else {
              if (!acc[comment.parent_id]) {
                acc[comment.parent_id] = { id: comment.parent_id, replies: [] };
              }
              acc[comment.parent_id].replies.push(comment);
            }
            return acc;
          }, {} as Record<string, any>);

          // Convert to array and sort by created_at
          sortedThreads = Object.values(threadedComments) as ThreadComment[];
          sortedThreads = sortedThreads
            .filter((thread) => thread.content)
            .sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }
      } catch (error) {
        console.error('Error processing comments:', error);
        // Don't throw here, continue with empty comments
      }

      // Combine the data
      const taskWithDetails: TaskWithDetails = {
        ...basicTask,
        intern_profiles: basicTask.intern_profiles ? {
          ...basicTask.intern_profiles,
          total_points: basicTask.intern_profiles.total_points || 0
        } : null,
        comments: sortedThreads || []
      };

      setIsAdmin(isUserAdmin);
      setTask(taskWithDetails);
      setIsLoading(false);
    } catch (error) {
      console.error('Task loading error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      toast({
        title: "Error loading task",
        description: error instanceof Error ? error.message : "Failed to load task details",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!task || !user) return;

    try {
      // If status has changed, update it
      if (selectedStatus && selectedStatus !== task.status) {
        console.log('Attempting to update status from', task.status, 'to', selectedStatus);
        
        // First verify the user has permission to update this task
        if (!isAdmin && task.assigned_to !== user.id) {
          throw new Error('You do not have permission to update this task');
        }

        // For interns, only allow updating to specific statuses
        if (!isAdmin) {
          if (!['in_progress', 'completed'].includes(selectedStatus)) {
            throw new Error('Invalid status for intern');
          }
        }

        console.log('Status update details:', {
          taskId: task.id,
          currentStatus: task.status,
          newStatus: selectedStatus,
          userId: user.id,
          isAdmin: isAdmin
        });

        // Simple status update - just update the status field
        const { data: updateData, error: updateError } = await supabase
          .from('tasks')
          .update({ status: selectedStatus })
          .eq('id', task.id)
          .select('status');  // Get back just the status field to verify update

        if (updateError) {
          console.error('Error updating task status:', updateError);
          throw new Error('Failed to update task status: ' + updateError.message);
        }

        if (!updateData || updateData.length === 0) {
          console.error('Update did not modify any rows - check permissions');
          throw new Error('Failed to update task - you may not have permission');
        }

        if (updateData[0].status !== selectedStatus) {
          console.error('Status was not updated as expected');
          throw new Error('Failed to update task status - unexpected result');
        }

        console.log('Status update successful - verified new status:', updateData[0].status);

        // Add a comment when task is marked as completed
        if (selectedStatus === 'completed') {
          const { error: commentError } = await supabase
            .from('task_comments')
            .insert({
              task_id: task.id,
              content: 'Task marked as completed',
              created_by: user.id
            });

          if (commentError) {
            console.error('Error adding completion comment:', commentError);
            // Don't throw here, as status was already updated
          }

          // Handle referral points if this is user's first completed task
          await handleReferralTaskCompletion(user.id);
        }

        // Show success message
        toast({
          title: "Success",
          description: selectedStatus === 'completed' ? 
            "Task marked as completed" : 
            "Task updated successfully",
        });
      }

      // If there's a comment, add it
      if (newComment.trim()) {
        const { error: commentError } = await supabase
          .from('task_comments')
          .insert({
            task_id: task.id,
            content: newComment.trim(),
            created_by: user.id,
            parent_id: replyTo
          });

        if (commentError) {
          console.error('Error adding comment:', commentError);
          throw new Error('Failed to add comment');
        }

        setNewComment("");
        setReplyTo(null);
      }

      await loadTask(); // Reload the task to get updated data
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleApproveTask = async () => {
    if (!task || !user || !isAdmin) return;

    try {
      console.log('Approving task:', task.id);
      
      // First update the task status to approved
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'approved' })
        .eq('id', task.id);

      if (updateError) {
        console.error('Error updating task status:', updateError);
        throw new Error('Failed to approve task: ' + updateError.message);
      }

      // Then update intern points if there's an assigned intern
      if (task.assigned_to) {
        console.log('Updating points for intern:', task.assigned_to);
        
        const { data: internProfile, error: pointsError } = await supabase
          .from('intern_profiles')
          .select('total_points')
          .eq('user_id', task.assigned_to)
          .single();

        if (pointsError) {
          console.error('Error fetching intern points:', pointsError);
          throw new Error('Failed to fetch intern points');
        }

        const currentPoints = internProfile?.total_points || 0;
        const newPoints = currentPoints + (task.points || 0);

        console.log('Updating points from', currentPoints, 'to', newPoints);

        const { error: updatePointsError } = await supabase
          .from('intern_profiles')
          .update({ total_points: newPoints })
          .eq('user_id', task.assigned_to);

        if (updatePointsError) {
          console.error('Error updating intern points:', updatePointsError);
          throw new Error('Failed to update intern points');
        }

        // Add a comment to record the approval
        const { error: commentError } = await supabase
          .from('task_comments')
          .insert({
            task_id: task.id,
            content: `Task approved and ${task.points} points awarded`,
            created_by: user.id
          });

        if (commentError) {
          console.error('Error adding approval comment:', commentError);
          // Don't throw here, as points were already awarded
        }

        toast({
          title: "Success",
          description: `Task approved and ${task.points} points awarded to intern`,
        });

        await loadTask(); // Reload the task to get updated data
      }
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve task",
        variant: "destructive",
      });
    }
  };

  const Comment = ({ comment, onReply }: { 
    comment: TaskWithDetails['comments'][0], 
    onReply: (parentId: string) => void 
  }) => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">
          {comment.user?.first_name || 'Unknown'} {comment.user?.last_name || 'User'} •{' '}
          {new Date(comment.created_at).toLocaleDateString()}
        </p>
        <p className="mb-2">{comment.content}</p>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onReply(comment.id)}
          className="text-sm text-gray-600"
        >
          Reply
        </Button>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {reply.user?.first_name || 'Unknown'} {reply.user?.last_name || 'User'} •{' '}
                {new Date(reply.created_at).toLocaleDateString()}
              </p>
              <p>{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const [replyTo, setReplyTo] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!task) {
    return <div className="p-8">Task not found</div>;
  }

  const canUpdateStatus = isAdmin || task.assigned_to === user?.id;
  const statusOptions: TaskStatus[] = isAdmin 
    ? ['open', 'assigned', 'in_progress', 'completed', 'approved', 'blocked', 'cancelled']
    : ['in_progress', 'completed'];  // Simplified options for interns

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{task.title}</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold">Description</h3>
            <p className="text-gray-600">{task.description}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Details</h3>
            <ul className="text-sm space-y-2">
              <li>Points: {task.points}</li>
              <li>Status: {task.status}</li>
              {task.is_paid && (
                <li>Payment: ${task.payment_amount}</li>
              )}
              {task.intern_profiles && (
                <li>
                  Assigned to: {task.intern_profiles.first_name} {task.intern_profiles.last_name}
                </li>
              )}
            </ul>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {canUpdateStatus && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Update Status</h3>
              <div className="flex gap-4">
                <Select
                  defaultValue={task.status}
                  value={selectedStatus || task.status}
                  onValueChange={(value: TaskStatus) => {
                    console.log('Status changed to:', value);
                    setSelectedStatus(value);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isAdmin && task.status === 'completed' && (
                  <Button
                    type="button"
                    onClick={handleApproveTask}
                    variant="outline"
                    className="bg-green-50 text-green-600 hover:bg-green-100"
                  >
                    Approve Task & Award Points
                  </Button>
                )}
              </div>
              {isAdmin && task.status === 'completed' && (
                <p className="text-sm text-gray-600 mt-2">
                  Click the approve button to award {task.points} points to the intern
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Comments</h3>
            
            <div className="space-y-6">
              {task.comments?.map((comment) => (
                <Comment 
                  key={comment.id} 
                  comment={comment}
                  onReply={(parentId) => {
                    setReplyTo(parentId);
                    // Focus the comment input
                    const textarea = document.querySelector('textarea');
                    if (textarea) {
                      textarea.focus();
                    }
                  }}
                />
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t pt-4">
              {replyTo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Replying to comment</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setReplyTo(null)}
                    className="h-auto p-0 text-gray-600"
                    type="button"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <Textarea
                placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button type="submit">
                Submit Changes
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
} 