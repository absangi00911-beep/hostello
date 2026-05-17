import React, { createContext, useContext, useEffect, useState } from 'react';
import { router, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

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

  // Rehydrate from AsyncStorage on mount
  useEffect(() => {
    async function rehydrate() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getAuthToken(),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);
        setToken(storedToken);
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
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    await Promise.all([
      clearAuthToken(),
      AsyncStorage.removeItem(USER_STORAGE_KEY),
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
