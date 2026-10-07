import { Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Select, Textarea, Input } from '@/components';
import { CHANNEL_OPTIONS } from '@/config';
import type { Campaign, Channel, GenerateCampaignPayload, SegmentWithCount } from '@/types';
import { getErrorMessage } from '@/utils';
import { generateCampaign } from '../api/campaignApi';
import { useCampaignStore } from '../store/useCampaignStore';
import { ToneSelector } from './ToneSelector';

interface CampaignFormProps {
  segments?: SegmentWithCount[];
  onGenerated?: (campaign: Campaign) => void;
}

export function CampaignForm({ segments = [], onGenerated }: CampaignFormProps) {
  const { form, setField, setCurrent } = useCampaignStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]).filter(([, v]) => v !== '')) as unknown as GenerateCampaignPayload;
      const campaign = await generateCampaign(payload);
      setCurrent(campaign);
      onGenerated?.(campaign);
    } catch (err) {
      setError(getErrorMessage(err, 'AI generation failed'));
    } finally {
      setBusy(false);
    }
  };

  const segmentOptions = segments.map((s) => ({ value: s.id, label: `${s.name} (${s.memberCount})` }));

  return (
    <form onSubmit={submit}>
      <Card title="Brief the assistant" description="Describe the goal; the AI drafts channel-ready copy.">
        <div className="space-y-4">
          <Alert>{error}</Alert>
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
            <Select label="Channel" options={CHANNEL_OPTIONS} value={form.channel} onChange={(e) => setField('channel', e.target.value as Channel)} />
            <Select label="Audience segment" placeholder="All opted-in customers" options={segmentOptions} value={form.segmentId} onChange={(e) => setField('segmentId', e.target.value)} />
          </div>
          <ToneSelector value={form.tone} onChange={(v) => setField('tone', v)} />
          <Input label="Product / offer (optional)" maxLength={500} placeholder="10% off annual support plans until 30 June" value={form.productOrOffer} onChange={(e) => setField('productOrOffer', e.target.value)} />
          <Textarea label="Extra instructions (optional)" rows={2} maxLength={1000} value={form.additionalInstructions} onChange={(e) => setField('additionalInstructions', e.target.value)} />
          <Button type="submit" icon={Sparkles} loading={busy} disabled={form.objective.trim().length < 10} className="w-full">
            {busy ? 'Generating…' : 'Generate campaign'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
