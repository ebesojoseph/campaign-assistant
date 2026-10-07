import { AlertCircle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils';

const styles: Record<'error' | 'success' | 'info', [string, LucideIcon]> = {
  error: ['border-red-200 bg-red-50 text-red-800', AlertCircle],
  success: ['border-green-200 bg-green-50 text-green-800', CheckCircle2],
  info: ['border-blue-200 bg-blue-50 text-blue-800', Info],
};

export function Alert({ variant = 'error', className, children }: { variant?: keyof typeof styles; className?: string; children?: ReactNode }) {
  if (!children) return null;
  const [cls, Icon] = styles[variant];
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm', cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
