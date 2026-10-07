import type { ReactNode } from 'react';
import type { BadgeTone } from '@/types';
import { cn } from '@/utils';

const tones: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
};

export function Badge({ tone = 'slate', className, children }: { tone?: BadgeTone; className?: string; children?: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>;
}
