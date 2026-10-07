import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components';
import { CUSTOMER_STATUSES } from '@/config';
import { CHART_COLORS, STATUS_COLORS, axisProps, tooltipStyle } from '@/lib/chart';
import type { CustomerStatus, Kpis } from '@/types';
import { formatCurrency, formatMonth, formatNumber } from '@/utils';

export function RevenueTrendChart({ data = [] }: { data?: Kpis['monthlyRevenue'] }) {
  const rows = data.map((d) => ({ ...d, label: formatMonth(d.month) }));
  return (
    <Card title="Revenue trend" description="Last 6 months">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={56} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip {...tooltipStyle} formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function StatusDistributionChart({ breakdown = {} }: { breakdown?: Partial<Record<CustomerStatus, number>> }) {
  const rows = CUSTOMER_STATUSES.map((s) => ({ ...s, count: breakdown[s.value] || 0 })).filter((s) => s.count > 0);
  return (
    <Card title="Customers by status">
      <div className="flex h-64 flex-col items-center gap-2 sm:flex-row">
        <div className="h-full w-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey="count" nameKey="label" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                {rows.map((r) => (
                  <Cell key={r.value} fill={STATUS_COLORS[r.value]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v, n) => [formatNumber(Number(v)), n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm sm:w-1/2 sm:grid-cols-1">
          {rows.map((r) => (
            <li key={r.value} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
              <span className="text-slate-600">{r.label}</span>
              <span className="ml-auto font-medium">{formatNumber(r.count)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function TopCountriesChart({ data = [] }: { data?: Kpis['topCountries'] }) {
  return (
    <Card title="Top countries by revenue">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
            <XAxis type="number" {...axisProps} tickFormatter={(v) => formatCurrency(v)} />
            <YAxis type="category" dataKey="country" {...axisProps} width={96} />
            <Tooltip {...tooltipStyle} formatter={(v, _n, p) => [`${formatCurrency(Number(v))} · ${formatNumber(p.payload.customers)} customers`, 'Revenue']} />
            <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
