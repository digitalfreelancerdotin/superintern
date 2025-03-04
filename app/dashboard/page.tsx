import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | SuperIntern',
  description: 'Manage your internship journey',
};

export default function Dashboard() {
  // Redirect to the intern dashboard
  redirect('/dashboard/intern');
} 