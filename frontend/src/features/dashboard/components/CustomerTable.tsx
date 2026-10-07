import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, Card, Input, Pagination, Select, Table, type Column } from '@/components';
import { CUSTOMER_STATUSES } from '@/config';
import { useAsync, useDebounce } from '@/hooks';
import type { Customer, CustomerSortKey, CustomerStatus } from '@/types';
import { formatCurrency, formatDate, getErrorMessage } from '@/utils';
import { getCustomers } from '../api/customerApi';
import { useCustomerStore } from '../store/useCustomerStore';
import { CustomerStatusBadge } from './CustomerStatusBadge';

const columns: Column<Customer>[] = [
  {
    key: 'name',
    header: 'Customer',
    sortKey: 'lastName',
    render: (c) => (
      <div>
        <p className="font-medium text-slate-900">
          {c.firstName} {c.lastName}
        </p>
        <p className="text-xs text-slate-500">{c.email}</p>
      </div>
    ),
  },
  { key: 'country', header: 'Location', render: (c) => [c.city, c.country].filter(Boolean).join(', ') || '—' },
  { key: 'status', header: 'Status', render: (c) => <CustomerStatusBadge status={c.status} /> },
  { key: 'orderCount', header: 'Orders', sortKey: 'orderCount', className: 'text-right' },
  { key: 'totalSpent', header: 'Total spent', sortKey: 'totalSpent', className: 'text-right', render: (c) => formatCurrency(c.totalSpent) },
  { key: 'lastPurchaseAt', header: 'Last purchase', sortKey: 'lastPurchaseAt', render: (c) => formatDate(c.lastPurchaseAt) },
];

export function CustomerTable() {
  const { page, limit, search, status, sortBy, order, setPage, setSearch, setStatus, toggleSort } = useCustomerStore();
  const [term, setTerm] = useState(search);
  const debounced = useDebounce(term, 400);

  useEffect(() => {
    if (debounced !== search) setSearch(debounced);
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error } = useAsync(
    () => getCustomers({ page, limit, search, status, sortBy, order }),
    [page, limit, search, status, sortBy, order]
  );

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Card
      title="Customers"
      bodyClassName="p-0"
      actions={
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
            <Input aria-label="Search customers" placeholder="Search name or email" className="w-56 pl-9" value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
          <Select aria-label="Filter by status" placeholder="All statuses" options={CUSTOMER_STATUSES} value={status} onChange={(e) => setStatus(e.target.value as CustomerStatus | '')} />
        </div>
      }
    >
      {error ? <Alert className="m-4">{getErrorMessage(error)}</Alert> : null}
      <Table<Customer> columns={columns} rows={rows} loading={loading} sort={{ key: sortBy, order }} onSort={(k) => toggleSort(k as CustomerSortKey)} empty="No customers match your filters" />
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
    </Card>
  );
}
