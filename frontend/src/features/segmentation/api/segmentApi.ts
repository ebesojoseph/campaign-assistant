import { api } from '@/lib/axios';
import type { CreateSegmentPayload, Segment, SegmentCriteria, SegmentPreview, SegmentWithCount } from '@/types';

export const getSegments = (params: { limit: number } = { limit: 100 }): Promise<SegmentWithCount[]> =>
  api.get<{ data: SegmentWithCount[] }>('/segments', { params }).then((r) => r.data.data);

export const createSegment = (payload: CreateSegmentPayload): Promise<Segment> =>
  api.post<{ data: Segment }>('/segments', payload).then((r) => r.data.data);

export const deleteSegment = (id: string): Promise<unknown> => api.delete(`/segments/${id}`);

/** Opted-out customers are always excluded server-side. */
export const previewSegment = (criteria: SegmentCriteria): Promise<SegmentPreview> =>
  api.post<{ data: SegmentPreview }>('/segments/preview', { criteria }).then((r) => r.data.data);
