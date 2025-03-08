import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type TaskStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'blocked' | 'cancelled';

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  created_by: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  is_paid: boolean;
  payment_amount?: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to?: string;
  completed_at?: string;
  comments?: TaskComment[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  points: number;
  is_paid: boolean;
  payment_amount?: number;
  created_by: string;
  assigned_to?: string;
}

export async function createTask(taskData: CreateTaskData) {
  const supabase = createClientComponentClient();
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createTask:', error);
    throw error;
  }
}

export async function getInternTasks(userId: string) {
  const supabase = createClientComponentClient();
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('status', { ascending: true })
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getInternTasks:', error);
    throw error;
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = createClientComponentClient();
  
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    throw error;
  }
}

export async function getAllTasks() {
  const supabase = createClientComponentClient();
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to:intern_profiles!tasks_assigned_to_fkey (
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getAllTasks:', error);
    throw error;
  }
} 