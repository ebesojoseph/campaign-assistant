import * as Dialog from '@radix-ui/react-dialog';
import { Save, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Input, Textarea } from '@/components';
import type { Segment } from '@/types';
import { getErrorMessage } from '@/utils';
import { createSegment } from '../api/segmentApi';
import { useSegmentStore } from '../store/useSegmentStore';
import { toApiCriteria, validateDraft } from '../utils/criteria';
import { CriteriaInput } from './CriteriaInput';
import { SegmentPreviewPanel } from './SegmentPreviewPanel';

interface SegmentBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (segment: Segment) => void;
}

export function SegmentBuilderModal({ open, onOpenChange, onCreated }: SegmentBuilderModalProps) {
  const { name, description, draft, setField, setCriterion, toggleStatus, reset } = useSegmentStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const criteria = useMemo(() => toApiCriteria(draft), [draft]);
  const errors = useMemo(() => validateDraft(draft), [draft]);
  const invalid = Object.keys(errors).length > 0;

  const handleClose = () => {
    setError('');
    reset();
    onOpenChange(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || invalid) return;
    setBusy(true);
    setError('');
    try {
      const seg = await createSegment({ name: name.trim(), description: description.trim() || undefined, criteria });
      onCreated?.(seg);
      handleClose(); // Automatically close dialog on success
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Modal Backdrop / Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity" />

        {/* Modal Content Window */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <Dialog.Title className="text-xl font-semibold text-slate-900">
                Build a segment
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                Combine rules to define an audience. All rules are AND-ed together.
              </Dialog.Description>
            </div>
            
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <form onSubmit={submit}>
              <div className="space-y-5">
                {error && <Alert>{error}</Alert>}
                <Input
                  label="Segment name"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setField('name', e.target.value)}
                />
                <Textarea
                  label="Description"
                  rows={2}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setField('description', e.target.value)}
                />
                <hr className="border-slate-100" />
                <CriteriaInput
                  draft={draft}
                  errors={errors}
                  onChange={setCriterion}
                  onToggleStatus={toggleStatus}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="ghost" type="button" onClick={handleClose}>
                    Cancel
                  </Button>

                  <Button variant="ghost" type="button" onClick={reset}>
                    Reset
                  </Button>

                  <Button type="submit" icon={Save} loading={busy} disabled={!name.trim() || invalid}>
                    Save segment
                  </Button>
                </div>
              </div>
            </form>

            <SegmentPreviewPanel criteria={criteria} disabled={invalid} />
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}