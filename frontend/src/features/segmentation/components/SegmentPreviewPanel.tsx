import { Users } from 'lucide-react';
import { Alert, Card, LoadingSpinner } from '@/components';
import { useAsync, useDebounce } from '@/hooks';
import type { SegmentCriteria } from '@/types';
import { formatCurrency, formatNumber, getErrorMessage } from '@/utils';
import { previewSegment } from '../api/segmentApi';

/** Live audience size + top spenders for the given (API-shaped) criteria. Debounced. */
export function SegmentPreviewPanel({ criteria, disabled }: { criteria: SegmentCriteria; disabled?: boolean }) {
  const key = useDebounce(JSON.stringify(criteria), 500);
  const { data, loading, error } = useAsync(() => previewSegment(JSON.parse(key) as SegmentCriteria), [key]);

  return (
    <Card title="Audience preview" description="Opted-in customers matching these rules" className="lg:sticky lg:top-6">
      {disabled ? (
        <p className="text-sm text-slate-500">Fix the highlighted fields to see a preview.</p>
      ) : (
        <>
          <Alert className="mb-3">{error ? getErrorMessage(error) : null}</Alert>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-3xl font-semibold tracking-tight">{data ? formatNumber(data.count) : '—'}</p>
              <p className="text-xs text-slate-500">matching customers</p>
            </div>
            {loading && <LoadingSpinner className="ml-auto" />}
          </div>
          {data && data.sample.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Top spenders</p>
              <ul className="divide-y divide-slate-100">
                {data.sample.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-slate-500">{formatCurrency(c.totalSpent)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data && data.count === 0 && <p className="mt-4 text-sm text-slate-500">No customers match. Try loosening the rules.</p>}
        </>
      )}
    </Card>
  );
}
