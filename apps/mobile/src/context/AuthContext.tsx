import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  getAuthToken,
  getAuthTokenExpiresAt,
  setAuthToken,
  clearAuthToken,
  apiRequest,
  buildApiUrl,
  normalizeTokenLifetimeSeconds,
  registerAuthExpiredHandler,
} from '../services/api';
import {
  clearRegisteredPushToken,
  getPushTokenIfPermissionGranted,
  getRegisteredPushToken,
  registerForPushNotifications,
  saveRegisteredPushToken,
} from '../services/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  token: string | null;
  user: StoredUser | null;
  isLoading: boolean;
  signIn: (token: string, user: StoredUser, expiresInSeconds: number) => Promise<void>;
  signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_STORAGE_KEY = 'auth_user';

/** Refresh proactively when fewer than this many days remain on the token. */
const REFRESH_THRESHOLD_DAYS = 5;
const REFRESH_THRESHOLD_SECONDS = REFRESH_THRESHOLD_DAYS * 24 * 60 * 60;
const REFRESH_RETRY_MS = 10 * 60 * 1000;
const MAX_TIMER_MS = 2_000_000_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ProactiveRefreshResult =
  | { status: 'refreshed'; token: string; expiresInSeconds: number }
  | { status: 'invalid' }
  | { status: 'unavailable' };

/** Call the refresh endpoint without parsing Auth.js's encrypted JWE on-device. */
async function proactiveRefresh(currentToken: string): Promise<ProactiveRefreshResult> {
  try {
    const response = await fetch(buildApiUrl('/auth/mobile/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'mobile',
        'Authorization': `Bearer ${currentToken}`,
      },
    });
    if (response.status === 401 || response.status === 403) return { status: 'invalid' };
    if (!response.ok) return { status: 'unavailable' };

    const json = await response.json() as {
      data?: { token?: unknown; expiresInSeconds?: unknown };
    };
    if (typeof json.data?.token !== 'string' || json.data.token.length === 0) {
      return { status: 'unavailable' };
    }

    return {
      status: 'refreshed',
      token: json.data.token,
      expiresInSeconds: normalizeTokenLifetimeSeconds(json.data.expiresInSeconds),
    };
  } catch {
    return { status: 'unavailable' };
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [refreshRetryAt, setRefreshRetryAt] = useState<number | null>(null);
  const refreshInFlight = useRef(false);

  const segments = useSegments();

  // Rehydrate both the opaque Auth.js token and server-supplied expiry metadata.
  useEffect(() => {
    async function rehydrate() {
      try {
        const [storedToken, storedUser, storedExpiresAt] = await Promise.all([
          getAuthToken(),
          SecureStore.getItemAsync(USER_STORAGE_KEY),
          getAuthTokenExpiresAt(),
        ]);

        if (storedToken) {
          setToken(storedToken);
          setTokenExpiresAt(storedExpiresAt);
        }

        setUser(storedUser ? (JSON.parse(storedUser) as StoredUser) : null);
      } catch {
        // Storage read failed — treat as logged out
      } finally {
        setIsLoading(false);
      }
    }
    rehydrate();
  }, []);

  // Clear React state as well as SecureStore when an API request confirms the
  // server rejected a revoked or expired session.
  useEffect(() => registerAuthExpiredHandler(async () => {
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setTokenExpiresAt(null);
    setRefreshRetryAt(null);
  }), []);

  // Refresh before expiry, and recheck whenever the app returns to the
  // foreground. Expiry is supplied by the server because Auth.js tokens are
  // encrypted JWE values whose claims cannot be inspected by the client.
  useEffect(() => {
    if (!token) return;

    let mounted = true;
    const refreshIfDue = async () => {
      if (refreshInFlight.current) return;
      if (
        tokenExpiresAt !== null &&
        tokenExpiresAt - Date.now() > REFRESH_THRESHOLD_SECONDS * 1000
      ) {
        return;
      }

      refreshInFlight.current = true;
      try {
        const storedToken = await getAuthToken();
        if (!storedToken) {
          await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
          if (mounted) {
            setToken(null);
            setUser(null);
            setTokenExpiresAt(null);
          }
          return;
        }

        const result = await proactiveRefresh(storedToken);
        if (!mounted) return;

        if (result.status === 'refreshed') {
          const expiresAt = await setAuthToken(result.token, result.expiresInSeconds);
          if (!mounted) return;
          setToken(result.token);
          setTokenExpiresAt(expiresAt);
          setRefreshRetryAt(null);
          return;
        }

        if (result.status === 'invalid') {
          await clearAuthToken();
          await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
          if (!mounted) return;
          setToken(null);
          setUser(null);
          setTokenExpiresAt(null);
          setRefreshRetryAt(null);
          return;
        }

        // Keep a usable token during transient network/provider failures and
        // retry later or as soon as the app becomes active again.
        setRefreshRetryAt(Date.now() + REFRESH_RETRY_MS);
      } catch {
        if (mounted) setRefreshRetryAt(Date.now() + REFRESH_RETRY_MS);
      } finally {
        refreshInFlight.current = false;
      }
    };

    const refreshAt = tokenExpiresAt === null
      ? Date.now()
      : tokenExpiresAt - REFRESH_THRESHOLD_SECONDS * 1000;
    const now = Date.now();
    const nextActionAt = refreshRetryAt !== null && refreshRetryAt > now
      ? refreshRetryAt
      : refreshAt;
    const delay = Math.max(0, nextActionAt - now);
    const timer = setTimeout(() => {
      if (refreshAt > Date.now()) {
        setRefreshRetryAt(refreshAt);
      } else {
        void refreshIfDue();
      }
    }, Math.min(delay, MAX_TIMER_MS));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshIfDue();
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [token, tokenExpiresAt, refreshRetryAt]);

  // Route guard — redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [token, segments, isLoading]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const signIn = async (
    newToken: string,
    newUser: StoredUser,
    expiresInSeconds: number,
  ) => {
    const expiresAt = await setAuthToken(newToken, expiresInSeconds);
    await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setTokenExpiresAt(expiresAt);
    setRefreshRetryAt(null);

    // Register push token after login — fire and forget, never block sign-in
    registerForPushNotifications()
      .then(async (result) => {
        if (!result) return;
        await apiRequest('/device-tokens', {
          method: 'POST',
          body: JSON.stringify(result),
        });
        await saveRegisteredPushToken(result.token);
      })
      .catch((err) => console.warn('[push] Token registration failed:', err));
  };

  const signOut = async () => {
    // Reuse the token saved at registration. If upgrading from an older build,
    // read it only when permission is already granted; never prompt during sign-out.
    try {
      const token = await getRegisteredPushToken() ?? await getPushTokenIfPermissionGranted();
      if (token) {
        await apiRequest('/device-tokens', {
          method: 'DELETE',
          body: JSON.stringify({ token }),
        });
        await clearRegisteredPushToken();
      }
    } catch (err) {
      // Keep the cached token so a later sign-in can transfer it to the right user.
      console.warn('[push] Token unregistration failed:', err);
    }

    await Promise.all([
      clearAuthToken(),
      SecureStore.deleteItemAsync(USER_STORAGE_KEY),
    ]);
    setToken(null);
    setUser(null);
    setTokenExpiresAt(null);
    setRefreshRetryAt(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
