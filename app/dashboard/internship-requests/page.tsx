"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface InternshipRequest {
  id: number;
  company_name: string;
  email: string;
  positions: number;
  requirements: string;
  created_at: string;
}

export default function InternshipRequests() {
  const [requests, setRequests] = useState<InternshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data, error } = await supabase
          .from('company_requirements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching requests:', error);
          return;
        }

        setRequests(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Corporate Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Submitted On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No internship requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.company_name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.positions}</TableCell>
                        <TableCell className="max-w-xs truncate" title={request.requirements}>
                          {request.requirements}
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 