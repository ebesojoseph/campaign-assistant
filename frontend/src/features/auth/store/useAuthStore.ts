import { create } from 'zustand';
import { registerAuthHandlers } from '@/lib/axios';
import type { LoginCredentials, Session, User } from '@/types';
import * as authApi from '../api/authApi';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  setSession: (session: Pick<Session, 'accessToken' | 'user'>) => void;
  clearSession: () => void;
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Session state. The access token lives in memory ONLY (never localStorage) so XSS cannot read a
 * long-lived credential; the refresh token is an HttpOnly cookie the JS code cannot see.
 * status: 'idle' -> 'loading' -> 'authenticated' | 'unauthenticated'
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,

  setSession: ({ accessToken, user }) => set({ accessToken, user, status: 'authenticated' }),
  clearSession: () => set({ accessToken: null, user: null, status: 'unauthenticated' }),

  /** Called once on app start: try to resume the session from the refresh cookie. */
  initialize: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'loading' });
    try {
      await authApi.refresh(); // onSession handler populates the store
    } catch {
      get().clearSession();
    }
  },

  login: async (credentials) => {
    const session = await authApi.login(credentials);
    get().setSession(session);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      get().clearSession();
    }
  },
}));

// Connect the HTTP layer to this store (token injection, silent refresh results, forced logout).
registerAuthHandlers({
  getToken: () => useAuthStore.getState().accessToken,
  onSession: (session) => useAuthStore.getState().setSession(session),
  onLogout: () => useAuthStore.getState().clearSession(),
});
