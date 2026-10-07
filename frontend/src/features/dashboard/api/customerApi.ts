import { api } from '@/lib/axios';
import type { Customer, CustomerQuery, Kpis, Paginated } from '@/types';

const clean = (params: object) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

/** Returns { data: Customer[], meta: { page, limit, total, totalPages } } */
export const getCustomers = (params: CustomerQuery): Promise<Paginated<Customer>> =>
  api.get<Paginated<Customer>>('/customers', { params: clean(params) }).then((r) => r.data);

/** Aggregated KPIs: totals, status breakdown, top countries, 6-month revenue. */
export const getKpis = (): Promise<Kpis> => api.get<{ data: Kpis }>('/customers/stats').then((r) => r.data.data);
