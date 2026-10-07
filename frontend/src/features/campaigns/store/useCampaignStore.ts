import { create } from 'zustand';
import type { Campaign, Channel, Tone } from '@/types';

export interface CampaignFormState {
  objective: string;
  channel: Channel;
  tone: Tone;
  segmentId: string;
  productOrOffer: string;
  additionalInstructions: string;
}

const initialForm: CampaignFormState = { objective: '', channel: 'email', tone: 'friendly', segmentId: '', productOrOffer: '', additionalInstructions: '' };

interface CampaignState {
  form: CampaignFormState;
  current: Campaign | null; // the campaign currently shown in the result card
  setField: <K extends keyof CampaignFormState>(key: K, value: CampaignFormState[K]) => void;
  setCurrent: (campaign: Campaign | null) => void;
  resetForm: () => void;
}

export const useCampaignStore = create<CampaignState>()((set) => ({
  form: { ...initialForm },
  current: null,

  setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
  setCurrent: (current) => set({ current }),
  resetForm: () => set({ form: { ...initialForm } }),
}));
