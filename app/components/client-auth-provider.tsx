'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from "../context/auth-context";

export default function ClientAuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return <AuthProvider>{children}</AuthProvider>;
} 