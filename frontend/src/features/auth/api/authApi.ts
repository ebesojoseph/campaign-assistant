import { api, refreshSession } from '@/lib/axios';
import type { LoginCredentials, RegisterPayload, Session, User } from '@/types';

export const login = (credentials: LoginCredentials): Promise<Session> =>
  api.post<{ data: Session }>('/auth/login', credentials).then((r) => r.data.data);

export const register = (payload: RegisterPayload): Promise<User> =>
  api.post<{ data: { user: User } }>('/auth/register', payload).then((r) => r.data.data.user);

export const logout = (): Promise<unknown> => api.post('/auth/logout');

export const getMe = (): Promise<User> => api.get<{ data: { user: User } }>('/auth/me').then((r) => r.data.data.user);

/** Restores a session from the HttpOnly cookie (single-flight, see lib/axios). */
export const refresh = (): Promise<Session> => refreshSession();
