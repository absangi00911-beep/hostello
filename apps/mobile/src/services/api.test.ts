import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, clearAuthToken } from './api';

// Mock expo-secure-store (the real storage layer after SecureStore migration)
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import * as SecureStore from 'expo-secure-store';

// Mock global fetch
global.fetch = vi.fn();

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles 401 Unauthorized by clearing token', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 401,
      ok: false,
    });

    await expect(apiRequest('/test')).rejects.toThrow('Unauthorized: Session expired');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
  });

  it('handles successful API requests', async () => {
    const mockData = { id: 1 };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ data: mockData }),
    });

    const result = await apiRequest('/test');
    expect(result).toEqual(mockData);
  });

  it('throws error on non-401 API failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 500,
      ok: false,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    });

    await expect(apiRequest('/test')).rejects.toThrow('Internal Server Error');
  });

  it('includes Bearer token in Authorization header when token is present', async () => {
    (SecureStore.getItemAsync as ReturnType<typeof vi.fn>).mockResolvedValue('test-jwt-token');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });

    await apiRequest('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      })
    );
  });

  it('omits Authorization header when no token is stored', async () => {
    (SecureStore.getItemAsync as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });

    await apiRequest('/test');

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(callArgs.headers).not.toHaveProperty('Authorization');
  });
});