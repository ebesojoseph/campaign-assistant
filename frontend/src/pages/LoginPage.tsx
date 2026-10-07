import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Card } from '@/components';
import { LoginForm, RegisterForm } from '@/features/auth';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => navigate(location.state?.from?.pathname || '/dashboard', { replace: true });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">AI Campaign Assistant</h1>
          <p className="text-sm text-slate-500">DME Systems · internal tool</p>
        </div>
        <Card>
          {mode === 'login' ? <LoginForm onSuccess={goBack} /> : <RegisterForm onSuccess={goBack} />}
        </Card>
        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === 'login' ? 'First time setting this up?' : 'Already have an account?'}{' '}
          <button className="font-medium text-brand-600 hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create the admin account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
