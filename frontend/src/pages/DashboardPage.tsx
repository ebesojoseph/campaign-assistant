import { RefreshCw } from 'lucide-react';
import { Alert, Button, PageHeader } from '@/components';
import { CustomerTable, KpiCards, RevenueTrendChart, StatusDistributionChart, TopCountriesChart, getKpis } from '@/features/dashboard';
import { useAsync } from '@/hooks';
import { getErrorMessage } from '@/utils';

export default function DashboardPage() {
  const { data: kpis, loading, error, reload } = useAsync(getKpis);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Customer base and revenue at a glance"
        actions={
          <Button variant="secondary" icon={RefreshCw} loading={loading && !!kpis} onClick={reload}>
            Refresh
          </Button>
        }
      />
      <div className="space-y-6">
        <Alert>{error ? getErrorMessage(error) : null}</Alert>
        <KpiCards kpis={kpis} loading={loading} />
        {kpis && (
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueTrendChart data={kpis.monthlyRevenue} />
            <StatusDistributionChart breakdown={kpis.statusBreakdown} />
            <div className="lg:col-span-2">
              <TopCountriesChart data={kpis.topCountries} />
            </div>
          </div>
        )}
        <CustomerTable />
      </div>
    </>
  );
}
