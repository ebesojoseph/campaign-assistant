type Num = number | string | null | undefined;
type DateLike = string | Date | null | undefined;

export const formatCurrency = (n: Num, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: Number(n) >= 1000 ? 0 : 2 }).format(Number(n) || 0);

export const formatNumber = (n: Num): string => new Intl.NumberFormat('en-US').format(Number(n) || 0);

export const formatPercent = (part: number, total: number): string => (total ? `${Math.round((part / total) * 100)}%` : '0%');

export const formatDate = (d: DateLike): string =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d: DateLike): string =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const formatMonth = (ym: string): string => {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
};
