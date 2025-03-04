import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - SuperIntern',
  description: 'Sign in to your SuperIntern account',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 