/**
 * Tests for API Client
 */

import { apiClient } from '../api-client';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('APIClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getAuthToken', () => {
    it('should retrieve token from secure store', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

      const token = await (apiClient as any).getAuthToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('adrata_auth_token');
      expect(token).toBe('test-token');
    });

    it('should return null if token retrieval fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Failed'));

      const token = await (apiClient as any).getAuthToken();

      expect(token).toBeNull();
    });
  });

  describe('setAuthToken', () => {
    it('should save token to secure store', async () => {
      await apiClient.setAuthToken('new-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('adrata_auth_token', 'new-token');
    });
  });

  describe('clearAuthToken', () => {
    it('should remove tokens from secure store', async () => {
      await apiClient.clearAuthToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('adrata_auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('adrata_refresh_token');
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
    });

    it('should make GET request with auth header', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('should make POST request with body', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.post('/test', { key: 'value' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle 401 errors by clearing token', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        statusCode: 401,
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        error: 'NetworkError',
      });
    });
  });
});
