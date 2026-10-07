import { TONE_OPTIONS } from '@/config';
import type { Tone } from '@/types';
import { cn } from '@/utils';

export function ToneSelector({ value, onChange }: { value: Tone; onChange: (tone: Tone) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">Tone of voice</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup">
        {TONE_OPTIONS.map((t) => {
          const on = value === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(t.value)}
              className={cn('rounded-lg border p-2.5 text-left transition-colors', on ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50')}
            >
              <p className={cn('text-sm font-medium', on && 'text-brand-700')}>{t.label}</p>
              <p className="text-xs text-slate-500">{t.hint}</p>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
