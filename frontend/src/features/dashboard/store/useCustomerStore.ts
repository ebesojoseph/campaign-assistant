import { create } from 'zustand';
import type { CustomerQuery, CustomerStatus } from '@/types';

const initial: CustomerQuery = { page: 1, limit: 10, search: '', status: '', sortBy: 'createdAt', order: 'desc' };

interface CustomerState extends CustomerQuery {
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: CustomerStatus | '') => void;
  toggleSort: (key: CustomerQuery['sortBy']) => void;
  reset: () => void;
}

export const useCustomerStore = create<CustomerState>()((set) => ({
  ...initial,
  setPage: (page) => set({ page }),
  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  toggleSort: (key) => set((s) => ({ sortBy: key, order: s.sortBy === key && s.order === 'desc' ? 'asc' : 'desc', page: 1 })),
  reset: () => set(initial),
}));
