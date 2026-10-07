import { create } from 'zustand';
import type { CustomerStatus } from '@/types';
import { EMPTY_CRITERIA, type CriteriaDraft } from '../utils/criteria';

interface SegmentState {
  name: string;
  description: string;
  draft: CriteriaDraft;
  setField: (field: 'name' | 'description', value: string) => void;
  setCriterion: <K extends keyof CriteriaDraft>(key: K, value: CriteriaDraft[K]) => void;
  toggleStatus: (status: CustomerStatus) => void;
  reset: () => void;
}

export const useSegmentStore = create<SegmentState>()((set) => ({
  name: '',
  description: '',
  draft: { ...EMPTY_CRITERIA },

  setField: (field, value) => set({ [field]: value }),
  setCriterion: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
  toggleStatus: (status) =>
    set((s) => {
      const has = s.draft.statuses.includes(status);
      return { draft: { ...s.draft, statuses: has ? s.draft.statuses.filter((x) => x !== status) : [...s.draft.statuses, status] } };
    }),
  reset: () => set({ name: '', description: '', draft: { ...EMPTY_CRITERIA } }),
}));
