'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "./Navbar";
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
import { ArrowRight, Trophy, TrendingUp } from 'lucide-react';

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

interface TrendingTask {
  id: string;
  title: string;
  points: number;
}

export default function HomeClient() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [trendingContent, setTrendingContent] = useState<TrendingTask[]>([]);
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
        // Fetch 5 available tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, points, is_paid, payment_amount')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch trending content
        const { data: trending } = await supabase
          .from('tasks')
          .select('id, title, points')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(5);

        setAvailableTasks(tasks || []);
        setTrendingContent(trending || []);
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
      <main>
        <Hero />
        <Features />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">Interns Leaderboard</h2>
          <InternTable />
          <div className="mt-16 grid gap-8">
            {/* Available Tasks Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Available Tasks</h2>
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

            {/* Trending Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Trending on TopInterns</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trendingContent.map((content, index) => (
                  <div key={content.id} className="p-4 rounded-lg border">
                    <h3 className="font-medium mb-2">{content.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {content.points} points awarded
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        <TrendingInternships />
        <StatsSection />
      </main>
    </>
  );
} 