import { api } from '@/lib/axios';
import type { Campaign, CampaignEdit, CampaignStatusPayload, GenerateCampaignPayload, Paginated, CampaignStatus, Channel } from '@/types';

const clean = (params: object) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
const AI_TIMEOUT = 60000; // generation is slow; allow 60s

export interface CampaignListParams {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  channel?: Channel;
  segmentId?: string;
  search?: string;
}

/** Generates copy with the AI and (by default) saves it as a draft. */
export const generateCampaign = (payload: GenerateCampaignPayload): Promise<Campaign> =>
  api.post<{ data: Campaign }>('/campaigns/generate', payload, { timeout: AI_TIMEOUT }).then((r) => r.data.data);

export const regenerateCampaign = (id: string, feedback?: string): Promise<Campaign> =>
  api.post<{ data: Campaign }>(`/campaigns/${id}/regenerate`, feedback ? { feedback } : {}, { timeout: AI_TIMEOUT }).then((r) => r.data.data);

/** Persist manual edits to a draft/approved campaign. */
export const saveCampaign = (id: string, patch: CampaignEdit): Promise<Campaign> =>
  api.put<{ data: Campaign }>(`/campaigns/${id}`, patch).then((r) => r.data.data);

export const updateCampaignStatus = (id: string, payload: CampaignStatusPayload): Promise<Campaign> =>
  api.patch<{ data: Campaign }>(`/campaigns/${id}/status`, payload).then((r) => r.data.data);

export const listCampaigns = (params: CampaignListParams = {}): Promise<Paginated<Campaign>> =>
  api.get<Paginated<Campaign>>('/campaigns', { params: clean({ limit: 20, ...params }) }).then((r) => r.data);

export const deleteCampaign = (id: string): Promise<unknown> => api.delete(`/campaigns/${id}`);
