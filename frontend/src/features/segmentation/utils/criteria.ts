import type { CustomerStatus, SegmentCriteria } from '@/types';

/** Form state for the builder. Everything except `statuses` is a string so inputs stay controlled. */
export interface CriteriaDraft {
  statuses: CustomerStatus[];
  countries: string; // comma separated in the UI
  minTotalSpent: string;
  maxTotalSpent: string;
  minOrderCount: string;
  maxOrderCount: string;
  purchasedWithinDays: string;
  inactiveForDays: string;
}

export type NumericCriterion = Exclude<keyof CriteriaDraft, 'statuses' | 'countries'>;
export type DraftErrors = Partial<Record<keyof CriteriaDraft, string>>;

export const EMPTY_CRITERIA: CriteriaDraft = {
  statuses: [],
  countries: '',
  minTotalSpent: '',
  maxTotalSpent: '',
  minOrderCount: '',
  maxOrderCount: '',
  purchasedWithinDays: '',
  inactiveForDays: '',
};

const NUMERIC: NumericCriterion[] = ['minTotalSpent', 'maxTotalSpent', 'minOrderCount', 'maxOrderCount', 'purchasedWithinDays', 'inactiveForDays'];

/** UI draft -> API criteria (drops empty fields, converts numbers). */
export function toApiCriteria(draft: CriteriaDraft): SegmentCriteria {
  const out: SegmentCriteria = {};
  if (draft.statuses.length) out.statuses = draft.statuses;
  const countries = draft.countries.split(',').map((c) => c.trim()).filter(Boolean);
  if (countries.length) out.countries = countries;
  for (const k of NUMERIC) {
    if (draft[k] !== '' && !Number.isNaN(Number(draft[k]))) out[k] = Number(draft[k]);
  }
  return out;
}

/** Client-side mirror of the API range checks, to give instant feedback. */
export function validateDraft(draft: CriteriaDraft): DraftErrors {
  const c = toApiCriteria(draft);
  const errors: DraftErrors = {};
  if (c.minTotalSpent !== undefined && c.maxTotalSpent !== undefined && c.minTotalSpent > c.maxTotalSpent) errors.maxTotalSpent = 'Must be ≥ minimum spend';
  if (c.minOrderCount !== undefined && c.maxOrderCount !== undefined && c.minOrderCount > c.maxOrderCount) errors.maxOrderCount = 'Must be ≥ minimum orders';
  return errors;
}

/** Human readable chips for a saved segment. */
export function describeCriteria(c: SegmentCriteria = {}): string[] {
  const out: string[] = [];
  if (c.statuses?.length) out.push(`Status: ${c.statuses.join(', ')}`);
  if (c.countries?.length) out.push(`Country: ${c.countries.join(', ')}`);
  if (c.minTotalSpent !== undefined || c.maxTotalSpent !== undefined) out.push(`Spend: ${c.minTotalSpent ?? 0}–${c.maxTotalSpent ?? '∞'}`);
  if (c.minOrderCount !== undefined || c.maxOrderCount !== undefined) out.push(`Orders: ${c.minOrderCount ?? 0}–${c.maxOrderCount ?? '∞'}`);
  if (c.purchasedWithinDays) out.push(`Bought in last ${c.purchasedWithinDays}d`);
  if (c.inactiveForDays) out.push(`Inactive ${c.inactiveForDays}d+`);
  return out.length ? out : ['All opted-in customers'];
}
