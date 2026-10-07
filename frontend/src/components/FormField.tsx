import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils';

const control =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50';

interface FieldMeta {
  label?: string;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

interface FieldProps extends Omit<FieldMeta, 'wrapperClassName'> {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, className, children, htmlFor }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Input({ label, hint, error, className, wrapperClassName, ...props }: FieldMeta & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} className={wrapperClassName}>
      <input id={id} className={cn(control, 'h-10', error && 'border-red-400', className)} {...props} />
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  className,
  wrapperClassName,
  ...props
}: FieldMeta & SelectHTMLAttributes<HTMLSelectElement> & { options: readonly SelectOption[]; placeholder?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} className={wrapperClassName}>
      <select id={id} className={cn(control, 'h-10', className)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Textarea({ label, hint, error, className, wrapperClassName, rows = 4, ...props }: FieldMeta & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} className={wrapperClassName}>
      <textarea id={id} rows={rows} className={cn(control, 'py-2', error && 'border-red-400', className)} {...props} />
    </Field>
  );
}
