import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { FullPageSpinner } from '@/components';
import { useAuthStore } from '@/features/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'idle' || status === 'loading') return <FullPageSpinner />;
  if (status !== 'authenticated') return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === 'idle' || status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return children;
}
