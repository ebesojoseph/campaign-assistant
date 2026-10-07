import { Badge } from '@/components';
import { CAMPAIGN_STATUSES, findOption } from '@/config';

import type { CampaignStatus } from '@/types';

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const opt = findOption(CAMPAIGN_STATUSES, status);
  return <Badge tone={opt?.tone}>{opt?.label ?? status}</Badge>;
}
