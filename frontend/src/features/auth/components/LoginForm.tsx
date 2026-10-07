import { LogIn } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Input } from '@/components';
import { getErrorCode, getErrorMessage } from '@/utils';
import { useAuthStore } from '../store/useAuthStore';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      onSuccess?.();
    } catch (err) {
      setError(getErrorCode(err) === 'RATE_LIMITED' ? getErrorMessage(err) : getErrorMessage(err, 'Unable to sign in'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Alert>{error}</Alert>
      <Input label="Email" type="email" autoComplete="username" required value={form.email} onChange={set('email')} />
      <Input label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={set('password')} />
      <Button type="submit" loading={busy} icon={LogIn} className="w-full" disabled={!form.email || !form.password}>
        Sign in
      </Button>
    </form>
  );
}
