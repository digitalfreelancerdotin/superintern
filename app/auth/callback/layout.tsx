import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authenticating - SuperIntern',
  description: 'Completing your authentication',
};

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 