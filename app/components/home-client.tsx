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

export default function HomeClient() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && session) {
      router.push('/dashboard/intern');
    }
  }, [session, router, isLoading]);

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
        </div>
        <TrendingInternships />
        <StatsSection />
      </main>
    </>
  );
} 