import { UserPlus } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Input } from '@/components';
import { getErrorMessage, getErrorStatus } from '@/utils';
import * as authApi from '../api/authApi';
import { useAuthStore } from '../store/useAuthStore';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}
type FormErrors = Partial<Record<keyof RegisterFormValues, string>>;

const validate = ({ name, email, password }: RegisterFormValues): FormErrors => {
  const e: FormErrors = {};
  if (!name.trim()) e.name = 'Name is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
  if (password.length < 10) e.password = 'At least 10 characters';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'Include a letter and a digit';
  return e;
};

/** First-run setup: the API only allows public registration for the very first (admin) account. */
export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState<RegisterFormValues>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof RegisterFormValues) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError('');
    try {
      await authApi.register({ ...form, name: form.name.trim(), email: form.email.trim() });
      await login({ email: form.email.trim(), password: form.password });
      onSuccess?.();
    } catch (err) {
      const status = getErrorStatus(err);
      setError(status === 401 || status === 403 ? 'Registration is closed. Ask an administrator to create your account.' : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Alert>{error}</Alert>
      <Input label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
      <Input label="Email" type="email" autoComplete="username" value={form.email} onChange={set('email')} error={errors.email} />
      <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="Min. 10 characters with a letter and a digit" />
      <Button type="submit" loading={busy} icon={UserPlus} className="w-full">
        Create admin account
      </Button>
    </form>
  );
}
