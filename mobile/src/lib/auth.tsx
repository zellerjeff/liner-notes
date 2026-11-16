import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, getToken, setToken, setUnauthorizedHandler } from '@/lib/api';
import {
  loadStoredToken,
  loadStoredUser,
  saveStoredToken,
  saveStoredUser,
} from '@/lib/token-store';
import type { User } from '@/lib/types';
import { resetItems } from '@/hooks/use-items';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  /** Exchange a provider ID token (or a demo name) for an API session. */
  completeSignIn: (
    provider: 'google' | 'apple' | 'demo',
    idToken: string,
    name?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-fetch the profile (slug, visibility, …) from the server. */
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<User | null>(null);

  // Restore the stored session once on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadStoredToken();
      if (stored) setToken(stored);
      const hasToken = !!stored || !!getToken(); // getToken covers EXPO_PUBLIC_DEV_TOKEN
      const storedUser = await loadStoredUser();
      if (cancelled) return;
      if (storedUser) {
        try {
          setUserState(JSON.parse(storedUser) as User);
        } catch {
          // ignore a corrupt cache; refreshUser repairs it
        }
      }
      setStatus(hasToken ? 'signedIn' : 'signedOut');
      if (hasToken) {
        // Freshen the profile in the background; a dead token signs us out via 401.
        api
          .getProfile()
          .then(({ user: fresh }) => {
            if (!cancelled) {
              setUserState(fresh);
              saveStoredUser(JSON.stringify(fresh));
            }
          })
          .catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    await saveStoredToken(null);
    await saveStoredUser(null);
    resetItems();
    setUserState(null);
    setStatus('signedOut');
  }, []);

  // Any 401 from a normal API call means the token died — sign out cleanly.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const completeSignIn = useCallback<AuthContextValue['completeSignIn']>(
    async (provider, idToken, name) => {
      const { token, user: freshUser } = await api.signIn(provider, idToken, name);
      setToken(token);
      await saveStoredToken(token);
      await saveStoredUser(JSON.stringify(freshUser));
      resetItems();
      setUserState(freshUser);
      setStatus('signedIn');
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const { user: fresh } = await api.getProfile();
    setUserState(fresh);
    await saveStoredUser(JSON.stringify(fresh));
  }, []);

  const setUser = useCallback((u: User) => {
    setUserState(u);
    saveStoredUser(JSON.stringify(u));
  }, []);

  const value = useMemo(
    () => ({ status, user, completeSignIn, signOut, refreshUser, setUser }),
    [status, user, completeSignIn, signOut, refreshUser, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
