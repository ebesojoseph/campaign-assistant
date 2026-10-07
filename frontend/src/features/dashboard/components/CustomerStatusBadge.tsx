import { Badge } from '@/components';
import { CUSTOMER_STATUSES, findOption } from '@/config';

import type { CustomerStatus } from '@/types';

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const opt = findOption(CUSTOMER_STATUSES, status);
  return <Badge tone={opt?.tone}>{opt?.label ?? status}</Badge>;
}
