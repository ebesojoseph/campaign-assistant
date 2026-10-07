import { DollarSign, Megaphone, TrendingUp, Users } from "lucide-react";
import { Card, LoadingSpinner } from "@/components";
import type { Kpis } from "@/types";
import { formatCurrency, formatNumber, formatPercent } from "@/utils";

export function KpiCards({
  kpis,
  loading,
}: {
  kpis: Kpis | null;
  loading?: boolean;
}) {
  const items = kpis
    ? [
        {
          label: "Total customers",
          value: formatNumber(kpis.totalCustomers),
          icon: Users,
        },
        {
          label: "Active Customers",
          value: formatNumber(kpis.activeCustomers),
          icon: Megaphone,
        },
        {
          label: "Total Transaction Value",
          value: formatCurrency(kpis.totalTransactionValue),
          icon: DollarSign,
        },
        {
          label: "Avg. Customer value",
          value: formatCurrency(kpis.avgCustomerValue),
          icon: TrendingUp,
        },
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
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label} bodyClassName="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {value}
            </p>
          </div>
          <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <Icon className="h-5 w-5" />
          </span>
        </Card>
      ))}
    </div>
  );
}
