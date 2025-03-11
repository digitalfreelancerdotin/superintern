'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from "./Navbar";
import Hero from "./Hero";
import { Features } from "./Features";
import { InternTable } from "./InternTable";
import TrendingInternships from "./trending-internships";
import StatsSection from "./stats-section";
import { useAuth } from '../context/auth-context';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { ArrowRight } from 'lucide-react';

interface InternProfile {
  first_name: string;
  last_name: string;
  total_points: number;
}

interface Task {
  id: string;
  title: string;
  points: number;
  is_paid: boolean;
  payment_amount: number;
}

export default function HomeClient() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && session) {
      router.push('/dashboard/intern');
    }
  }, [session, router, isLoading]);

  useEffect(() => {
    async function loadData() {
      try {
        // Only fetch available tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, points, is_paid, payment_amount')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);

        setAvailableTasks(tasks || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, []);

  if (!isMounted || isLoading) {
    return null; // or a loading spinner
  }

  return (
    <>
      <Navbar />
      <section id="hero" className="w-full">
        <Hero />
      </section>

      <main className="max-w-7xl mx-auto">
        <section id="features">
          <Features />
        </section>
        
        <section className="w-full relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-transparent pointer-events-none" />
          <div id="leaderboard" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Interns Leaderboard</h2>
            <InternTable />
          </div>
        </section>

        <section id="tasks" className="px-4 sm:px-6 lg:px-8 space-y-8 py-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Internship Opportunities</h2>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Available Tasks</h3>
              </div>
              <Link href="/login">
                <Button variant="ghost" className="gap-2 cursor-pointer">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.points} pts</TableCell>
                    <TableCell>
                      {task.is_paid ? `$${task.payment_amount}` : 'Unpaid'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/login">
                        <Button size="sm" className="cursor-pointer">
                          Apply
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {availableTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No tasks available at the moment
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section id="stats" className="py-12">
          <StatsSection />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="text-center text-sm text-gray-600">
          © {new Date().getFullYear()} SuperInterns. All rights reserved.
        </div>
      </footer>
    </>
  );
} 