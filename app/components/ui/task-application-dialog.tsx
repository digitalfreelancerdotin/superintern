"use client"

import * as React from "react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Textarea } from "./textarea"
import { useState } from "react"
import { useToast } from "./use-toast"

interface TaskApplicationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  taskTitle: string
  taskPoints: number
  taskPayment: string | number
}

export function TaskApplicationDialog({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  taskPoints,
  taskPayment,
}: TaskApplicationDialogProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for applying",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(reason)
      toast({
        title: "Success",
        description: "Your application has been submitted successfully",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for Task: {taskTitle}</DialogTitle>
          <DialogDescription>
            Points: {taskPoints} | Payment: {taskPayment}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="reason"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Why do you want to apply for this task?
              </label>
              <Textarea
                id="reason"
                placeholder="Please describe your relevant experience and why you're confident you can complete this task successfully..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[150px]"
                required
              />
              <p className="text-sm text-muted-foreground">
                Include details about:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Your relevant experience in this field</li>
                  <li>Why you're the best candidate for this task</li>
                  <li>Any similar projects you've worked on</li>
                  <li>Tools and technologies you're familiar with</li>
                </ul>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 