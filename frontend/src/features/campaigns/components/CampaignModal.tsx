import * as Dialog from '@radix-ui/react-dialog';
import { Sparkles, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Input, Select, Textarea } from '@/components';
import { CHANNEL_OPTIONS } from '@/config';
import type { Campaign, Channel, GenerateCampaignPayload, SegmentWithCount } from '@/types';
import { getErrorMessage } from '@/utils';
import { generateCampaign } from '../api/campaignApi';
import { useCampaignStore } from '../store/useCampaignStore';
import { ToneSelector } from './ToneSelector';

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segments?: SegmentWithCount[];
  onGenerated?: (campaign: Campaign) => void;
}

export function CampaignModal({
  open,
  onOpenChange,
  segments = [],
  onGenerated,
}: CampaignModalProps) {
  const { form, setField, setCurrent } = useCampaignStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    onOpenChange(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = Object.fromEntries(
        Object.entries(form)
          .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
          .filter(([, v]) => v !== '')
      ) as unknown as GenerateCampaignPayload;

      const campaign = await generateCampaign(payload);
      setCurrent(campaign);
      onGenerated?.(campaign);
      handleClose(); // Close modal on success
    } catch (err) {
      setError(getErrorMessage(err, 'AI generation failed'));
    } finally {
      setBusy(false);
    }
  };

  const segmentOptions = segments.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.memberCount})`,
  }));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop / Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity" />

        {/* Modal Window */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <Dialog.Title className="text-xl font-semibold text-slate-900">
                Brief the assistant
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 mt-0.5">
                Describe the goal; the AI drafts channel-ready copy.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form Body */}
          <form onSubmit={submit} className="space-y-4">
            {error && <Alert>{error}</Alert>}

            <Textarea
              label="Campaign objective"
              required
              minLength={10}
              maxLength={1000}
              placeholder="e.g. Win back VIP customers who haven't purchased in 90 days"
              value={form.objective}
              onChange={(e) => setField('objective', e.target.value)}
              hint={`${form.objective.length}/1000`}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Channel"
                options={CHANNEL_OPTIONS}
                value={form.channel}
                onChange={(e) => setField('channel', e.target.value as Channel)}
              />
              <Select
                label="Audience segment"
                placeholder="All opted-in customers"
                options={segmentOptions}
                value={form.segmentId}
                onChange={(e) => setField('segmentId', e.target.value)}
              />
            </div>

            <ToneSelector value={form.tone} onChange={(v) => setField('tone', v)} />

            <Input
              label="Product / offer (optional)"
              maxLength={500}
              placeholder="10% off annual support plans until 30 June"
              value={form.productOrOffer}
              onChange={(e) => setField('productOrOffer', e.target.value)}
            />

            <Textarea
              label="Extra instructions (optional)"
              rows={2}
              maxLength={1000}
              value={form.additionalInstructions}
              onChange={(e) => setField('additionalInstructions', e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                icon={Sparkles}
                loading={busy}
                disabled={form.objective.trim().length < 10}
              >
                {busy ? 'Generating…' : 'Generate campaign'}
              </Button>
            </div>
          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}