'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import type { UserProfile } from '@/lib/types';

export interface InitialAuth {
  isLoggedIn: boolean;
  user: UserProfile | null;
}

export default function Providers({
  children,
  initialAuth,
}: {
  children: React.ReactNode;
  initialAuth?: InitialAuth;
}) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AuthProvider initialAuth={initialAuth}>{children}</AuthProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
