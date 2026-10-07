import { CheckCircle2, RefreshCw, Save, CalendarClock, Archive } from 'lucide-react';
import { useState } from 'react';
import type { Campaign, CampaignStatus } from '@/types';
import { Alert, Button, Card, Input, Modal, Textarea } from '@/components';
import { CAMPAIGN_TRANSITIONS, CHANNEL_LIMITS } from '@/config';
import { cn, getErrorMessage } from '@/utils';
import { regenerateCampaign, saveCampaign, updateCampaignStatus } from '../api/campaignApi';
import { CampaignStatusBadge } from './CampaignStatusBadge';

const EDITABLE = ['subject', 'preheader', 'content', 'callToAction'] as const;
type EditKey = (typeof EDITABLE)[number];
type EditState = Record<EditKey, string>;

const pick = (c: Campaign): EditState => ({
  subject: c.subject ?? '',
  preheader: c.preheader ?? '',
  content: c.content ?? '',
  callToAction: c.callToAction ?? '',
});

function Counter({ value, max }: { value: string; max?: number }) {
  if (!max) return null;
  return <span className={cn('text-xs', value.length > max ? 'font-medium text-red-600' : 'text-slate-500')}>{value.length}/{max}</span>;
}

/** Shows an AI-generated campaign; lets the user tweak, regenerate with feedback, and move it through the workflow. */
interface GeneratedCampaignCardProps {
  campaign: Campaign;
  onUpdated?: (campaign: Campaign) => void;
}

export function GeneratedCampaignCard({ campaign, onUpdated }: GeneratedCampaignCardProps) {
  const [edit, setEdit] = useState(() => pick(campaign));
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [when, setWhen] = useState('');

  const limits = CHANNEL_LIMITS[campaign.channel];
  const locked = ['scheduled', 'sent', 'archived'].includes(campaign.status);
  const dirty = EDITABLE.some((k) => edit[k] !== (campaign[k] ?? ''));
  const overLimit = Boolean((limits.subject && edit.subject.length > limits.subject) || edit.content.length > limits.content);
  const next = CAMPAIGN_TRANSITIONS[campaign.status] ?? [];

  const run = async (name: string, fn: () => Promise<Campaign>, successMsg?: string): Promise<boolean> => {
    setBusy(name);
    setError('');
    setNotice('');
    try {
      const updated = await fn();
      setEdit(pick(updated));
      onUpdated?.(updated);
      if (successMsg) setNotice(successMsg);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setBusy('');
    }
  };

  const save = () =>
    run('save', () => saveCampaign(campaign.id, { subject: edit.subject || undefined, preheader: edit.preheader || undefined, content: edit.content, callToAction: edit.callToAction || undefined }), 'Changes saved.');
  const regenerate = () => run('regen', () => regenerateCampaign(campaign.id, feedback.trim()), 'New version generated.').then((ok) => ok && setFeedback(''));
  const setStatus = (status: CampaignStatus, extra: { scheduledAt?: string } = {}) => run(status, () => updateCampaignStatus(campaign.id, { status, ...extra }), `Status: ${status}.`);

  const schedule = async () => {
    if (!when) return;
    if (await setStatus('scheduled', { scheduledAt: new Date(when).toISOString() })) setScheduleOpen(false);
  };

  return (
    <Card
      title={campaign.name}
      description={`${campaign.channel.toUpperCase()} · ${campaign.tone} · ${campaign.segment?.name ?? 'All opted-in customers'}`}
      actions={<CampaignStatusBadge status={campaign.status} />}
    >
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Alert variant="success">{notice}</Alert>
        {locked && <Alert variant="info">This campaign is {campaign.status}; move it back to Approved/Draft to edit.</Alert>}

        {limits.requiresSubject && (
          <Input label="Subject" disabled={locked} value={edit.subject} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} hint={<Counter value={edit.subject} max={limits.subject} />} />
        )}
        {campaign.channel === 'email' && <Input label="Preheader" disabled={locked} value={edit.preheader} onChange={(e) => setEdit({ ...edit, preheader: e.target.value })} />}
        <Textarea label="Message" rows={campaign.channel === 'email' ? 8 : 4} disabled={locked} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} hint={<Counter value={edit.content} max={limits.content} />} />
        <Input label="Call to action" disabled={locked} value={edit.callToAction} onChange={(e) => setEdit({ ...edit, callToAction: e.target.value })} />

        {campaign.rationale && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Why this works: </span>
            {campaign.rationale}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button icon={Save} variant="secondary" disabled={!dirty || locked || overLimit} loading={busy === 'save'} onClick={save}>
            Save edits
          </Button>
          {next.includes('approved') && (
            <Button icon={CheckCircle2} disabled={dirty} loading={busy === 'approved'} onClick={() => setStatus('approved')}>
              {campaign.status === 'scheduled' ? 'Unschedule' : 'Approve'}
            </Button>
          )}
          {next.includes('scheduled') && (
            <Button icon={CalendarClock} variant="secondary" disabled={!campaign.segment} title={campaign.segment ? '' : 'Pick a segment to schedule'} onClick={() => setScheduleOpen(true)}>
              Schedule
            </Button>
          )}
          {next.includes('draft') && (
            <Button variant="ghost" loading={busy === 'draft'} onClick={() => setStatus('draft')}>
              Back to draft
            </Button>
          )}
          {next.includes('archived') && (
            <Button variant="ghost" icon={Archive} loading={busy === 'archived'} onClick={() => setStatus('archived')}>
              Archive
            </Button>
          )}
        </div>

        {campaign.status === 'draft' && (
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
            <Input wrapperClassName="flex-1" label="Not quite right? Tell the AI what to change" placeholder="Shorter, mention free shipping" value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={1000} />
            <Button variant="secondary" icon={RefreshCw} loading={busy === 'regen'} disabled={dirty} onClick={regenerate}>
              Regenerate
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule campaign"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy === 'scheduled'} disabled={!when} onClick={schedule}>
              Schedule
            </Button>
          </>
        }
      >
        <Input label="Send at" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} />
        <Alert className="mt-3">{error}</Alert>
      </Modal>
    </Card>
  );
}
