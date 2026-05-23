import React, { createContext, useContext, useEffect, useState } from 'react';
import { router, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getAuthToken, setAuthToken, clearAuthToken, apiRequest } from '../services/api';
import { registerForPushNotifications } from '../services/notifications';

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
  signIn: (token: string, user: StoredUser) => Promise<void>;
  signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_STORAGE_KEY = 'auth_user';

/** Refresh proactively when fewer than this many days remain on the token. */
const REFRESH_THRESHOLD_DAYS = 5;
const REFRESH_THRESHOLD_SECONDS = REFRESH_THRESHOLD_DAYS * 24 * 60 * 60;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode the `iat` (issued-at) and `exp` (expiry) claims from a JWT payload
 * without verifying the signature — we only need these for the proactive
 * refresh heuristic, not for actual authentication.
 */
function getJwtClaims(token: string): { iat: number; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // atob is available in React Native's Hermes engine (via the global polyfill)
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    const iat = payload.iat;
    const exp = payload.exp;
    if (typeof iat !== 'number' || typeof exp !== 'number') return null;
    return { iat, exp };
  } catch {
    return null;
  }
}

/**
 * Call the refresh endpoint directly (no retry loop — this is a pre-emptive
 * call when we still have a valid token, so the first attempt should succeed).
 * Returns the new token on success, null on any failure.
 */
async function proactiveRefresh(currentToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/mobile/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'mobile',
        'Authorization': `Bearer ${currentToken}`,
      },
    });
    if (!response.ok) return null;
    const json = await response.json() as { data?: { token?: string } };
    return json?.data?.token ?? null;
  } catch {
    return null;
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

  const segments = useSegments();

  // Rehydrate from SecureStore on mount, then proactively refresh if close to expiry
  useEffect(() => {
    async function rehydrate() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getAuthToken(),
          SecureStore.getItemAsync(USER_STORAGE_KEY),
        ]);

        if (storedToken) {
          const claims = getJwtClaims(storedToken);
          const now = Math.floor(Date.now() / 1000);

          // Proactively refresh when fewer than REFRESH_THRESHOLD_DAYS remain,
          // so the user never hits an expired-token 401 during normal use.
          const shouldRefresh =
            claims !== null && claims.exp - now < REFRESH_THRESHOLD_SECONDS;

          if (shouldRefresh) {
            const refreshed = await proactiveRefresh(storedToken);
            if (refreshed) {
              await setAuthToken(refreshed);
              setToken(refreshed);
            } else {
              // Refresh failed — token is revoked or truly expired; force sign-out
              await clearAuthToken();
              await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
              setToken(null);
              setUser(null);
              return;
            }
          } else {
            setToken(storedToken);
          }
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

  const signIn = async (newToken: string, newUser: StoredUser) => {
    await Promise.all([
      setAuthToken(newToken),
      SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);

    // Register push token after login — fire and forget, never block sign-in
    registerForPushNotifications()
      .then((result) => {
        if (!result) return;
        return apiRequest('/api/device-tokens', {
          method: 'POST',
          body: JSON.stringify(result),
        });
      })
      .catch((err) => console.warn('[push] Token registration failed:', err));
  };

  const signOut = async () => {
    // Unregister push token before clearing auth
    try {
      const pushResult = await registerForPushNotifications();
      if (pushResult) {
        await apiRequest('/api/device-tokens', {
          method: 'DELETE',
          body: JSON.stringify({ token: pushResult.token }),
        }).catch(() => {});   // best-effort — don't block sign-out
      }
    } catch {}

    await Promise.all([
      clearAuthToken(),
      SecureStore.deleteItemAsync(USER_STORAGE_KEY),
    ]);
    setToken(null);
    setUser(null);
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