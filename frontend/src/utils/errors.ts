import axios from 'axios';
import type { ApiErrorBody } from '@/types';

const apiError = (err: unknown) => (axios.isAxiosError<ApiErrorBody>(err) ? err.response?.data?.error : undefined);

/** Turns an Axios/API error into a message that is safe to show to the user. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback;
  if (axios.isAxiosError(err) && err.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  const api = apiError(err);
  if (!api) return err instanceof Error ? err.message || fallback : fallback;
  const details = Array.isArray(api.details) ? api.details.map((d) => (d.field ? `${d.field} ${d.message}` : d.message)) : [];
  console.log(details);
  return details.length ? `${api.message}: ${details.join('; ')}` : api.message;
}

export const getErrorCode = (err: unknown): string | undefined => apiError(err)?.code;
export const getErrorStatus = (err: unknown): number | undefined => (axios.isAxiosError(err) ? err.response?.status : undefined);
