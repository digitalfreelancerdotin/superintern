"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { TaskApplicationDialog } from "./ui/task-application-dialog"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "./ui/use-toast"
import { useAuth } from '../context/auth-context'
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Card, CardContent } from "./ui/card"
import { Table, TableBody, TableCell, TableRow } from "./ui/table"

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  payment_amount: number | null;
  status: string;
}

interface TaskListProps {
  initialTasks?: Task[];
}

export function TaskList({ initialTasks = [] }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { user } = useAuth()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            No tasks available at the moment. Please check back later.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleApply = async (reason: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to apply for tasks",
        variant: "destructive",
      })
      return
    }

    if (!selectedTask) {
      toast({
        title: "Error",
        description: "No task selected",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if user has already applied
      const { data: existingApplication } = await supabase
        .from('task_applications')
        .select('id')
        .eq('task_id', selectedTask.id)
        .eq('user_id', user.id)
        .single()

      if (existingApplication) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this task",
          variant: "destructive",
        })
        return
      }

      // Insert new application
      const { error } = await supabase
        .from('task_applications')
        .insert([
          {
            task_id: selectedTask.id,
            user_id: user.id,
            application_reason: reason,
            status: 'pending'
          }
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Your application has been submitted successfully",
      })

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <div>
      <Table>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.title}</TableCell>
              <TableCell>{task.description}</TableCell>
              <TableCell>{task.points}</TableCell>
              <TableCell>
                {task.payment_amount ? `$${task.payment_amount}` : 'No payment'}
              </TableCell>
              <TableCell>{task.status}</TableCell>
              <TableCell>
                <Button
                  onClick={() => {
                    setSelectedTask(task)
                    setIsDialogOpen(true)
                  }}
                  disabled={task.status !== 'open'}
                >
                  Apply
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedTask && (
        <TaskApplicationDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedTask(null)
          }}
          onConfirm={handleApply}
          taskTitle={selectedTask.title}
          taskPoints={selectedTask.points}
          taskPayment={selectedTask.payment_amount || 'No payment'}
        />
      )}
    </div>
  )
} 