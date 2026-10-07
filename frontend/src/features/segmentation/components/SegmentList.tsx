import { Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Alert, Badge, Button, Card, LoadingSpinner, Modal } from '@/components';
import type { SegmentWithCount } from '@/types';
import { formatDate, formatNumber, getErrorMessage } from '@/utils';
import { deleteSegment } from '../api/segmentApi';
import { describeCriteria } from '../utils/criteria';

interface SegmentListProps {
  segments: SegmentWithCount[] | null;
  loading: boolean;
  error: unknown;
  onChanged?: () => void;
}

export function SegmentList({ segments, loading, error, onChanged }: SegmentListProps) {
  const [target, setTarget] = useState<SegmentWithCount | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const confirmDelete = async () => {
    setBusy(true);
    try {
      if (!target) return;
      await deleteSegment(target.id);
      setTarget(null);
      onChanged?.();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Saved segments" description="Reusable audiences for your campaigns">
      <Alert className="mb-3">{error ? getErrorMessage(error) : err}</Alert>
      {loading && !segments ? (
        <LoadingSpinner />
      ) : !segments?.length ? (
        <p className="py-6 text-center text-sm text-slate-500">No segments yet. Build your first one above.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {segments.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium">{s.name}</p>
                {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {describeCriteria(s.criteria).map((c) => (
                    <Badge key={c}>{c}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                  <Users className="h-4 w-4" />
                  {formatNumber(s.memberCount)}
                </span>
                <span className="hidden sm:inline">{formatDate(s.createdAt)}</span>
                <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Delete ${s.name}`} onClick={() => { setErr(''); setTarget(s); }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Delete segment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        Delete “{target?.name}”? Campaigns that used it will keep their copy but lose the audience link.
      </Modal>
    </Card>
  );
}
