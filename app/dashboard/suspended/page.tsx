'use client';

import { Card } from "@/app/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function SuspendedPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
          <h1 className="text-2xl font-bold">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. If you believe this is a mistake, please contact the administrator for assistance.
          </p>
        </div>
      </Card>
    </div>
  );
} 