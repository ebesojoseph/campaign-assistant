import { CUSTOMER_STATUSES } from '@/config';

export const CHART_COLORS = { primary: '#6366f1', secondary: '#a5b4fc', grid: '#e2e8f0', axis: '#64748b' };
export const STATUS_COLORS = Object.fromEntries(CUSTOMER_STATUSES.map((s) => [s.value, s.color]));

export const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: 12 },
  cursor: { fill: 'rgb(99 102 241 / 0.06)' },
};

export const axisProps = { tick: { fill: CHART_COLORS.axis, fontSize: 12 }, tickLine: false, axisLine: false };
