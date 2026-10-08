import * as SecureStore from 'expo-secure-store';
import { MOBILE_SESSION_MAX_AGE_SECONDS } from '@hostello/shared';

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
if (!rawApiBaseUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to your .env file.');
}
const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRES_AT_KEY = 'auth_token_expires_at_ms';
const REFRESH_UNAVAILABLE_MESSAGE = 'Session refresh is unavailable. Try again shortly.';

type TokenRefreshResult =
  | { status: 'refreshed'; token: string }
  | { status: 'invalid' }
  | { status: 'unavailable' };

let authExpiredHandler: (() => void | Promise<void>) | null = null;

export function registerAuthExpiredHandler(handler: () => void | Promise<void>): () => void {
  authExpiredHandler = handler;
  return () => {
    if (authExpiredHandler === handler) authExpiredHandler = null;
  };
}

export function normalizeTokenLifetimeSeconds(value: unknown): number {
  if (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= MOBILE_SESSION_MAX_AGE_SECONDS
  ) {
    return value;
  }

  // Keep clients compatible during a rolling deploy with a server that does
  // not yet return expiry metadata. Both old mobile paths used this lifetime.
  return MOBILE_SESSION_MAX_AGE_SECONDS;
}

export function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export function normalizeApiEndpoint(endpoint: string): string {
  const withLeadingSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (withLeadingSlash === '/api') return '';
  return withLeadingSlash.replace(/^\/api(?=\/)/, '');
}

const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);

export function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${normalizeApiEndpoint(endpoint)}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getAuthHeaders(includeAuth = true): Promise<Record<string, string>> {
  const token = includeAuth ? await SecureStore.getItemAsync(TOKEN_KEY) : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client': 'mobile',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Attempt to exchange the stored token for a fresh one.
 * Keeps transient failures distinct from a server-confirmed invalid session so
 * offline users are not signed out just because refresh could not complete.
 *
 * On success the new token is persisted to SecureStore immediately so
 * the retry in apiRequest() picks it up via getAuthHeaders().
 */
async function attemptTokenRefresh(): Promise<TokenRefreshResult> {
  const currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!currentToken) return { status: 'invalid' };

  let response: Response;
  try {
    response = await fetch(buildApiUrl('/auth/mobile/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'mobile',
        'Authorization': `Bearer ${currentToken}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      return { status: 'invalid' };
    }
    if (!response.ok) return { status: 'unavailable' };

    const json = await response.json() as {
      data?: { token?: unknown; expiresInSeconds?: unknown };
    };
    const newToken = json.data?.token;
    if (typeof newToken !== 'string' || newToken.length === 0) {
      return { status: 'unavailable' };
    }

    await setAuthToken(
      newToken,
      normalizeTokenLifetimeSeconds(json.data?.expiresInSeconds),
    );
    return { status: 'refreshed', token: newToken };
  } catch {
    // Network, response parsing, and secure-storage failures are retryable.
    return { status: 'unavailable' };
  }
}

async function expireStoredSession(): Promise<void> {
  await clearAuthToken();
  try {
    await authExpiredHandler?.();
  } catch {
    // A UI cleanup failure must not turn an invalid server token into a valid one.
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Make an authenticated API request.
 *
 * On a 401 response the function will automatically:
 *   1. Attempt to refresh the stored JWT via /auth/mobile/refresh
 *   2. Retry the original request exactly once with the new token
 *   3. Clear the stored token only when the server confirms the session is
 *      invalid; keep it when refresh fails transiently so the user can retry
 *
 * The `_isRetry` parameter is an internal guard — callers should never
 * pass it; it prevents the refresh+retry cycle from looping infinitely.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const isCredentialLogin = normalizeApiEndpoint(endpoint) === '/auth/mobile/login';
  const headers = await getAuthHeaders(!isCredentialLogin);
  const requestHeaders: Record<string, string> = {
    ...headers,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (isCredentialLogin) delete requestHeaders.Authorization;

  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers: requestHeaders,
  });

  const hasBearerToken = requestHeaders.Authorization?.startsWith('Bearer ') ?? false;
  if (response.status === 401 && hasBearerToken) {
    if (!_isRetry) {
      const refresh = await attemptTokenRefresh();
      if (refresh.status === 'refreshed') {
        // Retry once with the refreshed token (isRetry = true prevents loops)
        return apiRequest<T>(endpoint, options, true);
      }

      if (refresh.status === 'unavailable') {
        throw new Error(REFRESH_UNAVAILABLE_MESSAGE);
      }
    }
    // A rejected refresh or a second 401 means the session is no longer usable.
    await expireStoredSession();
    throw new Error('Unauthorized: Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
    const errorMessage =
      (errorData.error as string) ||
      (errorData.message as string) ||
      `API Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const json = await response.json() as { data: T };
  return json.data;
}

// ---------------------------------------------------------------------------
// Token helpers (used by AuthContext)
// ---------------------------------------------------------------------------

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getAuthTokenExpiresAt(): Promise<number | null> {
  const value = await SecureStore.getItemAsync(TOKEN_EXPIRES_AT_KEY);
  if (!value) return null;

  const expiresAt = Number(value);
  return Number.isSafeInteger(expiresAt) && expiresAt > 0 ? expiresAt : null;
}

export async function setAuthToken(
  token: string,
  expiresInSeconds: unknown = MOBILE_SESSION_MAX_AGE_SECONDS,
): Promise<number> {
  const expiresAt = Date.now() + normalizeTokenLifetimeSeconds(expiresInSeconds) * 1000;
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(TOKEN_EXPIRES_AT_KEY, String(expiresAt)),
  ]);
  return expiresAt;
}

export async function clearAuthToken(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT_KEY),
  ]);
}
