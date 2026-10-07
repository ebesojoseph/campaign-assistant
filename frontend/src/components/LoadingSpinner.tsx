import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

export function LoadingSpinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return <Loader2 role="status" aria-label={label} className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}
