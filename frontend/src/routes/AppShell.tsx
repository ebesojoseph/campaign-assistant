import { useNavigate } from 'react-router';
import { AppLayout } from '@/components';
import { useAuthStore } from '@/features/auth';

/** Wires the feature-agnostic layout to the auth feature. */
export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  return <AppLayout user={user} onLogout={() => logout().finally(() => navigate('/login', { replace: true }))} />;
}
