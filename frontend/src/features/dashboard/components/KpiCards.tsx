import { DollarSign, Megaphone, TrendingUp, Users } from 'lucide-react';
import { Card, LoadingSpinner } from '@/components';
import type { Kpis } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/utils';

export function KpiCards({ kpis, loading }: { kpis: Kpis | null; loading?: boolean }) {
  const items = kpis
    ? [
        { label: 'Total customers', value: formatNumber(kpis.totalCustomers), sub: `${formatNumber(kpis.payingCustomers)} have purchased`, icon: Users },
        { label: 'Reachable (opted-in)', value: formatNumber(kpis.marketingOptIn), sub: `${formatPercent(kpis.marketingOptIn, kpis.totalCustomers)} of customers`, icon: Megaphone },
        { label: 'Lifetime revenue', value: formatCurrency(kpis.totalRevenue), sub: 'All recorded purchases', icon: DollarSign },
        { label: 'Avg. lifetime value', value: formatCurrency(kpis.avgLifetimeValue), sub: 'Per paying customer', icon: TrendingUp },
      ]
    : [];

  if (!kpis) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-slate-200 bg-white">
        {loading && <LoadingSpinner />}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, sub, icon: Icon }) => (
        <Card key={label} bodyClassName="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{sub}</p>
          </div>
          <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <Icon className="h-5 w-5" />
          </span>
        </Card>
      ))}
    </div>
  );
}
