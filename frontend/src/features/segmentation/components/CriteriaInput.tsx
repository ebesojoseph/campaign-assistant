import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components';
import { CUSTOMER_STATUSES } from '@/config';
import type { CustomerStatus } from '@/types';
import { cn } from '@/utils';
import type { CriteriaDraft, DraftErrors, NumericCriterion } from '../utils/criteria';

interface CriteriaInputProps {
  draft: CriteriaDraft;
  errors?: DraftErrors;
  onChange: <K extends keyof CriteriaDraft>(key: K, value: CriteriaDraft[K]) => void;
  onToggleStatus: (status: CustomerStatus) => void;
}

/** Controlled editor for one criteria draft. Pure presentational: state lives in the segment store. */
export function CriteriaInput({ draft, errors = {}, onChange, onToggleStatus }: CriteriaInputProps) {
  const num = (key: NumericCriterion, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Input label={label} type="number" min="0" inputMode="decimal" value={draft[key]} onChange={(e) => onChange(key, e.target.value)} error={errors[key]} {...props} />
  );

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Customer status</legend>
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_STATUSES.map((s) => {
            const on = draft.statuses.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleStatus(s.value)}
                className={cn('rounded-full border px-3 py-1 text-sm transition-colors', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50')}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-slate-500">Leave empty to include every status.</p>
      </fieldset>

      <Input label="Countries" placeholder="Cameroon, Nigeria" value={draft.countries} onChange={(e) => onChange('countries', e.target.value)} hint="Comma separated" />

      <div className="grid gap-4 sm:grid-cols-2">
        {num('minTotalSpent', 'Min. total spent')}
        {num('maxTotalSpent', 'Max. total spent')}
        {num('minOrderCount', 'Min. orders', { step: '1' })}
        {num('maxOrderCount', 'Max. orders', { step: '1' })}
        {num('purchasedWithinDays', 'Purchased within last (days)', { step: '1', min: '1' })}
        {num('inactiveForDays', 'Inactive for at least (days)', { step: '1', min: '1' })}
      </div>
    </div>
  );
}
