import type { BadgeTone, CampaignStatus, Channel, CustomerStatus, Tone } from '@/types';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface Option<V extends string = string> {
  value: V;
  label: string;
}
export interface ToneOption extends Option<Tone> {
  hint: string;
}
export interface StatusOption<V extends string> extends Option<V> {
  tone: BadgeTone;
  color?: string;
}

export const CUSTOMER_STATUSES: StatusOption<CustomerStatus>[] = [
  { value: 'lead', label: 'Lead', tone: 'slate', color: '#94a3b8' },
  { value: 'active', label: 'Active', tone: 'green', color: '#22c55e' },
  { value: 'vip', label: 'VIP', tone: 'violet', color: '#8b5cf6' },
  { value: 'inactive', label: 'Inactive', tone: 'amber', color: '#f59e0b' },
  { value: 'churned', label: 'Churned', tone: 'red', color: '#ef4444' },
];

export const CHANNEL_OPTIONS: Option<Channel>[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export interface ChannelLimit {
  subject?: number;
  content: number;
  requiresSubject?: boolean;
}
// Mirrors the API's per-channel limits (used for live character counters).
export const CHANNEL_LIMITS: Record<Channel, ChannelLimit> = {
  email: { subject: 150, content: 5000, requiresSubject: true },
  sms: { content: 160 },
  push: { subject: 50, content: 150, requiresSubject: true },
  whatsapp: { content: 1000 },
};

export const TONE_OPTIONS: ToneOption[] = [
  { value: 'professional', label: 'Professional', hint: 'Clear, credible, polished' },
  { value: 'friendly', label: 'Friendly', hint: 'Warm and conversational' },
  { value: 'urgent', label: 'Urgent', hint: 'Time-sensitive, action-driven' },
  { value: 'playful', label: 'Playful', hint: 'Light, witty, fun' },
  { value: 'luxury', label: 'Luxury', hint: 'Refined and exclusive' },
  { value: 'empathetic', label: 'Empathetic', hint: 'Caring and understanding' },
];

export const CAMPAIGN_STATUSES: StatusOption<CampaignStatus>[] = [
  { value: 'draft', label: 'Draft', tone: 'slate' },
  { value: 'approved', label: 'Approved', tone: 'blue' },
  { value: 'scheduled', label: 'Scheduled', tone: 'amber' },
  { value: 'sent', label: 'Sent', tone: 'green' },
  { value: 'archived', label: 'Archived', tone: 'red' },
];

export const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['approved', 'archived'],
  approved: ['draft', 'scheduled', 'archived'],
  scheduled: ['approved', 'sent', 'archived'],
  sent: ['archived'],
  archived: ['draft'],
};

export const findOption = <T extends { value: string }>(list: readonly T[], value: string): T | undefined =>
  list.find((o) => o.value === value);
