import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to your .env file.');
}
const TOKEN_KEY = 'auth_token';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
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
 * Returns the new token string on success, or null if the refresh fails
 * (e.g. token revoked, network error, rate limited).
 *
 * On success the new token is persisted to SecureStore immediately so
 * the retry in apiRequest() picks it up via getAuthHeaders().
 */
async function attemptTokenRefresh(): Promise<string | null> {
  const currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!currentToken) return null;

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

    const json = await response.json();
    const newToken: string | undefined = json?.data?.token;
    if (!newToken) return null;

    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    return newToken;
  } catch {
    // Network error or parse failure — treat as refresh unavailable
    return null;
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
 *   3. If refresh fails, clear the stored token and throw so AuthContext
 *      can redirect to the login screen
 *
 * The `_isRetry` parameter is an internal guard — callers should never
 * pass it; it prevents the refresh+retry cycle from looping infinitely.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (response.status === 401) {
    if (!_isRetry) {
      const newToken = await attemptTokenRefresh();
      if (newToken) {
        // Retry once with the refreshed token (isRetry = true prevents loops)
        return apiRequest<T>(endpoint, options, true);
      }
    }
    // Refresh unavailable or already retried — clear credentials and surface the error
    await clearAuthToken();
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

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}