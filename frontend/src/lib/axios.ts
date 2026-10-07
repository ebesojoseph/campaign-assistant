import axios from 'axios';
import { API_URL } from '@/config';
import type { Session } from '@/types';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

interface AuthHandlers {
  getToken: () => string | null;
  onSession: (session: Session) => void;
  onLogout: () => void;
}

/**
 * Auth wiring is injected by the auth feature (see registerAuthHandlers) so that this
 * low-level module never imports from a feature (keeps the dependency direction clean).
 */
let handlers: AuthHandlers = { getToken: () => null, onSession: () => {}, onLogout: () => {} };
export const registerAuthHandlers = (h: Partial<AuthHandlers>): void => {
  handlers = { ...handlers, ...h };
};

const baseConfig = { baseURL: API_URL, withCredentials: true, timeout: 30000 };

export const api = axios.create(baseConfig);
// Interceptor-free client for the refresh call itself (prevents refresh loops).
const bare = axios.create(baseConfig);

let inflight: Promise<Session> | null = null;
/**
 * Single-flight session refresh. Refresh tokens are single-use server-side, so concurrent callers
 * (parallel 401s, React StrictMode double-mount) MUST share one request or the API will flag token reuse.
 */
export function refreshSession(): Promise<Session> {
  inflight ??= bare
    .post<{ data: Session }>('/auth/refresh')
    .then((res) => {
      handlers.onSession(res.data.data);
      return res.data.data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

api.interceptors.request.use((config) => {
  const token = handlers.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    const { config, response } = error;
    const isAuthCall = config?.url?.includes('/auth/');
    if (response?.status === 401 && config && !config._retry && !isAuthCall) {
      config._retry = true;
      try {
        const session = await refreshSession();
        config.headers.Authorization = `Bearer ${session.accessToken}`;
        return api(config);
      } catch (refreshError) {
        // Only a definitive auth failure ends the session; network blips should not log people out.
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) handlers.onLogout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
