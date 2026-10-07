import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button, Card, Modal, Table, type Column } from '@/components';
import { findOption, CHANNEL_OPTIONS } from '@/config';
import type { Campaign } from '@/types';
import { formatDateTime, getErrorMessage } from '@/utils';
import { deleteCampaign } from '../api/campaignApi';
import { CampaignStatusBadge } from './CampaignStatusBadge';

interface CampaignListProps {
  campaigns?: Campaign[];
  loading: boolean;
  error: unknown;
  selectedId?: string;
  onSelect?: (campaign: Campaign) => void;
  onChanged?: (removed: Campaign) => void;
}

export function CampaignList({ campaigns = [], loading, error, selectedId, onSelect, onChanged }: CampaignListProps) {
  const [target, setTarget] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const remove = async () => {
    setBusy(true);
    try {
      if (!target) return;
      await deleteCampaign(target.id);
      setTarget(null);
      onChanged?.(target);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      render: (c) => (
        <button onClick={() => onSelect?.(c)} className={`text-left font-medium hover:text-brand-700 ${c.id === selectedId ? 'text-brand-700' : 'text-slate-900'}`}>
          {c.name}
        </button>
      ),
    },
    { key: 'channel', header: 'Channel', render: (c) => findOption(CHANNEL_OPTIONS, c.channel)?.label },
    { key: 'status', header: 'Status', render: (c) => <CampaignStatusBadge status={c.status} /> },
    { key: 'segment', header: 'Segment', render: (c) => c.segment?.name ?? 'All customers' },
    { key: 'createdAt', header: 'Created', render: (c) => formatDateTime(c.createdAt) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) =>
        c.status !== 'sent' && <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Delete ${c.name}`} onClick={() => { setErr(''); setTarget(c); }} />,
    },
  ];

  return (
    <Card title="Campaign history" bodyClassName="p-0">
      <Alert className="m-4">{error ? getErrorMessage(error) : err}</Alert>
      <Table<Campaign> columns={columns} rows={campaigns} loading={loading} empty="No campaigns yet" />
      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Delete campaign"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        Permanently delete “{target?.name}”?
      </Modal>
    </Card>
  );
}
