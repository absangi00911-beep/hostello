import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, clearAuthToken } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles 401 Unauthorized by clearing token', async () => {
    (global.fetch as any).mockResolvedValue({
      status: 401,
      ok: false,
    });

    await expect(apiRequest('/test')).rejects.toThrow('Unauthorized: Session expired');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('handles successful API requests', async () => {
    const mockData = { id: 1 };
    (global.fetch as any).mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ data: mockData }),
    });

    const result = await apiRequest('/test');
    expect(result).toEqual(mockData);
  });

  it('throws error on non-401 API failure', async () => {
    (global.fetch as any).mockResolvedValue({
      status: 500,
      ok: false,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    });

    await expect(apiRequest('/test')).rejects.toThrow('Internal Server Error');
  });
});
