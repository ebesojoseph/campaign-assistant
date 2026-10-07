import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { FullPageSpinner } from '@/components';
import { useAuthStore } from '@/features/auth';
import { router } from '@/routes';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const status = useAuthStore((s) => s.status);

  // Resume the session from the HttpOnly refresh cookie before rendering any guarded route.
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (status === 'idle' || status === 'loading') return <FullPageSpinner />;
  return <RouterProvider router={router} />;
}
