"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/auth-context";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";

export default function CreateTaskPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points: "",
    is_paid: false,
    payment_amount: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First verify admin status
      const { data: adminCheck, error: adminError } = await supabase
        .from('intern_profiles')
        .select('is_admin')
        .eq('user_id', user!.id)
        .single();

      if (adminError || !adminCheck?.is_admin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Create the task
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: formData.title,
          description: formData.description,
          points: parseInt(formData.points),
          is_paid: formData.is_paid,
          payment_amount: formData.is_paid ? parseFloat(formData.payment_amount) : 0,
          status: 'open',
          created_by: user!.id
        });

      if (taskError) throw taskError;

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      router.push('/dashboard/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaidChange = (checked: boolean) => {
    setFormData((prev) => ({ 
      ...prev, 
      is_paid: checked,
      payment_amount: checked ? prev.payment_amount : ""
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
      
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Task description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              name="points"
              type="number"
              min="0"
              value={formData.points}
              onChange={handleChange}
              required
              placeholder="Points for completing this task"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_paid"
              checked={formData.is_paid}
              onCheckedChange={handlePaidChange}
            />
            <Label htmlFor="is_paid">This is a paid task</Label>
          </div>

          {formData.is_paid && (
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Payment Amount ($)</Label>
              <Input
                id="payment_amount"
                name="payment_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.payment_amount}
                onChange={handleChange}
                required
                placeholder="Payment amount in USD"
              />
            </div>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </Card>
    </div>
  );
} 