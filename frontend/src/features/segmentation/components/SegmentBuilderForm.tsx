import { Save } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Input, Textarea } from '@/components';
import type { Segment } from '@/types';
import { getErrorMessage } from '@/utils';
import { createSegment } from '../api/segmentApi';
import { useSegmentStore } from '../store/useSegmentStore';
import { toApiCriteria, validateDraft } from '../utils/criteria';
import { CriteriaInput } from './CriteriaInput';
import { SegmentPreviewPanel } from './SegmentPreviewPanel';

export function SegmentBuilderForm({ onCreated }: { onCreated?: (segment: Segment) => void }) {
  const { name, description, draft, setField, setCriterion, toggleStatus, reset } = useSegmentStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const criteria = useMemo(() => toApiCriteria(draft), [draft]);
  const errors = useMemo(() => validateDraft(draft), [draft]);
  const invalid = Object.keys(errors).length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || invalid) return;
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const seg = await createSegment({ name: name.trim(), description: description.trim() || undefined, criteria });
      setSaved(`Segment “${seg.name}” saved.`);
      reset();
      onCreated?.(seg);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit}>
        <Card title="Build a segment" description="Combine rules to define an audience. All rules are AND-ed together.">
          <div className="space-y-5">
            <Alert>{error}</Alert>
            <Alert variant="success">{saved}</Alert>
            <Input label="Segment name" required maxLength={120} value={name} onChange={(e) => setField('name', e.target.value)} />
            <Textarea label="Description" rows={2} maxLength={2000} value={description} onChange={(e) => setField('description', e.target.value)} />
            <hr className="border-slate-100" />
            <CriteriaInput draft={draft} errors={errors} onChange={setCriterion} onToggleStatus={toggleStatus} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset}>
                Reset
              </Button>
              <Button type="submit" icon={Save} loading={busy} disabled={!name.trim() || invalid}>
                Save segment
              </Button>
            </div>
          </div>
        </Card>
      </form>
      <SegmentPreviewPanel criteria={criteria} disabled={invalid} />
    </div>
  );
}
